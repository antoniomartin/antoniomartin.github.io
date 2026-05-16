import { CRMService } from '../../services/crmService.js';
import { escapeHtml, showToast } from '../../utils/helpers.js';

let currentEmpresa = null;
let allTags = [];
let allEmpresas = [];
let pendingTags = [];
let pendingRelaciones = [];

export async function renderFichaEmpresa(id, isEditing = false) {
    if (!id) return;
    try {
        if (!isEditing) {
            currentEmpresa = await CRMService.getEmpresas().then(res => res.find(e => e.id === id));
            if (!currentEmpresa) throw new Error("Empresa no encontrada");
            pendingTags = currentEmpresa.tags ? [...currentEmpresa.tags] : [];
            allEmpresas = await CRMService.getEmpresas();
            
            // Recopilar todos los tags únicos de la BD
            const tagsSet = new Set();
            allEmpresas.forEach(e => {
                if (e.tags) e.tags.forEach(t => tagsSet.add(t));
            });
            allTags = Array.from(tagsSet);
            
            // Cargar relaciones actuales
            const rels = await CRMService.getRelacionesDeEmpresa(id);
            pendingRelaciones = rels.map(r => {
                const esFabricante = r.fabricanteId === id;
                return {
                    id: r.id, // Si existe en BD
                    empresaId: esFabricante ? r.distribuidorId : r.fabricanteId,
                    rol: esFabricante ? 'Distribuidor' : 'Fabricante',
                    preferente: r.preferente,
                    _original: r
                };
            });
        }

        const contactos = await CRMService.getContactos().then(res => res.filter(c => c.empresaId === id));
        const interacciones = await CRMService.getInteraccionesDeEmpresa(id);
        const icono = currentEmpresa.tipo === 'fabricante' ? '🏭' : currentEmpresa.tipo === 'distribuidor' ? '🚚' : '📦';
        const estadoClass = currentEmpresa.estado === 'activo' ? 'badge-active' : 'badge-inactive';

        // 1. Relaciones HTML
        let relacionesHtml = '';
        if (isEditing) {
            const relList = pendingRelaciones.map((r, index) => {
                const emp = allEmpresas.find(e => e.id === r.empresaId);
                return `
                    <div class="card-info-line" style="justify-content: space-between;">
                        <span>🔗 ${r.rol}: <strong>${emp ? escapeHtml(emp.nombre) : 'Desconocida'}</strong></span>
                        <button type="button" class="btn-icon text-danger" onclick="window.removeRelacion(${index})">❌</button>
                    </div>
                `;
            }).join('');
            
            relacionesHtml = `
                <div style="margin-bottom: 1rem;">${relList}</div>
                <div class="form-group" style="position:relative;">
                    <input type="text" id="relacion-input" class="form-input" placeholder="Buscar empresa para asociar..." autocomplete="off">
                    <div id="relacion-dropdown" class="autocomplete-dropdown"></div>
                </div>
            `;
        } else {
            if (pendingRelaciones.length > 0) {
                relacionesHtml = pendingRelaciones.map(r => {
                    const emp = allEmpresas.find(e => e.id === r.empresaId);
                    return `<div class="card-info-line">
                        🔗 ${r.rol}: <strong style="cursor:pointer; color:var(--color-primary);" onclick="window.abrirOtraFicha(${r.empresaId})">${emp ? escapeHtml(emp.nombre) : 'Desconocida'}</strong> 
                        ${r.preferente ? '<span class="badge badge-pending">Preferente</span>' : ''}
                    </div>`;
                }).join('');
            } else {
                relacionesHtml = '<p class="text-muted">No hay asociaciones registradas.</p>';
            }
        }

        // 2. Tags HTML
        let tagsHtml = '';
        if (isEditing) {
            tagsHtml = `
                <div class="form-group">
                    <label class="form-label">Materiales / Tags</label>
                    <div class="tags-input-container" id="tags-container">
                        ${pendingTags.map((t, i) => `<span class="tag-badge">${escapeHtml(t)} <span class="remove-tag" onclick="window.removeTag(${i})">×</span></span>`).join('')}
                        <div style="position:relative; flex-grow:1;">
                            <input type="text" id="tag-input" placeholder="Añadir tag..." autocomplete="off">
                            <div id="tag-dropdown" class="autocomplete-dropdown"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            if (pendingTags.length > 0) {
                tagsHtml = '<div style="margin-top:0.5rem;">' + pendingTags.map(t => `<span class="badge badge-tag" style="margin-right:0.2rem;">${escapeHtml(t)}</span>`).join('') + '</div>';
            }
        }

        const headerActions = isEditing ? `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <h3>Editando Empresa</h3>
                <div>
                    <button type="button" class="btn btn-outline" onclick="window.cancelarEdicion()">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="window.guardarEdicionEmpresa()">💾 Guardar</button>
                </div>
            </div>
        ` : `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <h3>Detalles</h3>
                <div>
                    <button type="button" class="btn btn-outline" onclick="window.activarEdicionEmpresa()">✏️ Editar</button>
                    <button type="button" class="btn btn-danger" onclick="window.eliminarEmpresa(${id})">🗑️ Eliminar</button>
                </div>
            </div>
        `;

        let detallesCardHtml = '';
        if (isEditing) {
            detallesCardHtml = `
                <div class="form-group"><label>Nombre</label><input type="text" id="edit-nombre" class="form-input" value="${escapeHtml(currentEmpresa.nombre || '')}"></div>
                <div class="form-group"><label>Tipo</label>
                    <select id="edit-tipo" class="form-select">
                        <option value="fabricante" ${currentEmpresa.tipo === 'fabricante' ? 'selected' : ''}>🏭 Fabricante</option>
                        <option value="distribuidor" ${currentEmpresa.tipo === 'distribuidor' ? 'selected' : ''}>🚚 Distribuidor</option>
                        <option value="proveedor" ${currentEmpresa.tipo === 'proveedor' ? 'selected' : ''}>📦 Proveedor de servicios</option>
                        <option value="otros" ${currentEmpresa.tipo === 'otros' ? 'selected' : ''}>⚪ Otros</option>
                    </select>
                </div>
                <div class="form-group"><label>NIT</label><input type="text" id="edit-nit" class="form-input" value="${escapeHtml(currentEmpresa.nit || '')}"></div>
                <div class="form-group"><label>Teléfono</label><input type="text" id="edit-telefono" class="form-input" value="${escapeHtml(currentEmpresa.telefono || '')}"></div>
                <div class="form-group"><label>Email</label><input type="email" id="edit-email" class="form-input" value="${escapeHtml(currentEmpresa.email_general || '')}"></div>
                <div class="form-group"><label>Web</label><input type="url" id="edit-web" class="form-input" value="${escapeHtml(currentEmpresa.pagina_web || '')}"></div>
                ${tagsHtml}
            `;
        } else {
            let webLink = currentEmpresa.pagina_web ? `<a href="${currentEmpresa.pagina_web}" target="_blank">${escapeHtml(currentEmpresa.pagina_web)}</a>` : 'No especificada';
            detallesCardHtml = `
                <div class="card-info-line">🏷️ Tipo: ${escapeHtml(currentEmpresa.tipo || 'General')}</div>
                <div class="card-info-line">📄 NIT: ${escapeHtml(currentEmpresa.nit || 'Sin NIT')}</div>
                <div class="card-info-line">📞 Teléfono: ${escapeHtml(currentEmpresa.telefono || 'Sin teléfono')}</div>
                <div class="card-info-line">✉️ Email: ${escapeHtml(currentEmpresa.email_general || 'Sin email')}</div>
                <div class="card-info-line">🌐 Web: ${webLink}</div>
                <div class="card-info-line">📅 Creada: ${new Date(currentEmpresa.fecha_creacion).toLocaleDateString()}</div>
                <div class="card-info-line">📊 Estado: <span class="badge ${estadoClass}">${currentEmpresa.estado}</span></div>
                ${tagsHtml ? '<hr style="margin: 0.5rem 0; border:0; border-top:1px solid var(--border-color);">' + tagsHtml : ''}
            `;
        }

        // 3. Organigrama HTML
        const treeMap = {};
        contactos.forEach(c => {
            if (!treeMap[c.id]) treeMap[c.id] = { ...c, children: [] };
            else Object.assign(treeMap[c.id], c);
            if (c.reporta_a) {
                if (!treeMap[c.reporta_a]) treeMap[c.reporta_a] = { children: [] };
                treeMap[c.reporta_a].children.push(treeMap[c.id]);
            }
        });
        const rootContacts = contactos.filter(c => !c.reporta_a).map(c => treeMap[c.id]);
        function renderTree(nodes) {
            if (!nodes || nodes.length === 0) return '';
            return `<ul class="tree-children">
                ${nodes.map(node => `
                    <li class="tree-node">
                        <div class="tree-node-content" onclick="document.dispatchEvent(new CustomEvent('abrirFichaContacto', { detail: { id: ${node.id} } }))">
                            👤 <strong>${escapeHtml(node.nombre)}</strong> - <span class="text-muted">${escapeHtml(node.cargo || 'Sin cargo')}</span>
                        </div>
                        ${renderTree(node.children)}
                    </li>
                `).join('')}
            </ul>`;
        }
        let organigramaHtml = rootContacts.length > 0 ? `<div class="tree-view">${renderTree(rootContacts)}</div>` : '<p class="text-muted">No hay contactos registrados.</p>';

        // 4. Interacciones HTML
        let interaccionesHtml = '<p class="text-muted">No hay interacciones recientes.</p>';
        if (interacciones.length > 0) {
            interaccionesHtml = interacciones.map(inter => `
                <div class="card-info-line" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); cursor:pointer;" onclick="document.dispatchEvent(new CustomEvent('abrirFichaInteraccion', { detail: { id: ${inter.id} } }))">
                    <div style="flex:1;">
                        <strong style="color:var(--color-primary);">${escapeHtml(inter.asunto)}</strong><br>
                        <small class="text-muted">${new Date(inter.fecha).toLocaleString()} - ${inter.tipo}</small>
                    </div>
                </div>
            `).join('');
        }

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;" id="ficha-empresa-container">
                <div>
                    ${headerActions}
                    <div class="card" style="margin-bottom: 1.5rem;">
                        ${detallesCardHtml}
                    </div>
                    
                    <h3 style="margin-bottom: 1rem;">Asociaciones</h3>
                    <div class="card" style="margin-bottom: 1.5rem; overflow: visible;">
                        ${relacionesHtml}
                    </div>
                </div>
                
                <div>
                    <h3 style="margin-bottom: 1rem;">Organigrama</h3>
                    <div class="card" style="margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;">
                        ${organigramaHtml}
                    </div>

                    <h3 style="margin-bottom: 1rem;">Interacciones Globales</h3>
                    <div class="card" style="max-height: 300px; overflow-y: auto;">
                        ${interaccionesHtml}
                    </div>
                </div>
            </div>
        `;

        const modalId = 'modal-ficha-empresa';
        
        if (!isEditing && !document.getElementById(modalId)) {
            // Es la primera vez que se abre la ficha
            const modalHtml = `
                <div class="modal-overlay active" id="${modalId}">
                    <div class="modal-content" style="max-width: 900px;">
                        <div class="modal-header">
                            <div class="modal-title">${icono} Ficha de Empresa: <span id="ficha-empresa-title">${escapeHtml(currentEmpresa.nombre)}</span></div>
                            <button class="btn-icon" onclick="window.closeModal('${modalId}')">❌</button>
                        </div>
                        <div class="modal-body" id="ficha-empresa-body">
                            ${bodyHtml}
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('modal-container').insertAdjacentHTML('beforeend', modalHtml);
        } else {
            // Solo reemplazamos el contenido
            document.getElementById('ficha-empresa-body').innerHTML = bodyHtml;
            document.getElementById('ficha-empresa-title').innerText = currentEmpresa.nombre;
        }

        // BIND EVENTS FOR EDIT MODE
        if (isEditing) {
            setupAutocompleteTags();
            setupAutocompleteRelaciones();
        }

    } catch (error) {
        console.error(error);
        alert("Error al cargar la ficha de la empresa.");
    }
}

// Global functions for inline editing
window.activarEdicionEmpresa = () => {
    renderFichaEmpresa(currentEmpresa.id, true);
};

window.cancelarEdicion = () => {
    renderFichaEmpresa(currentEmpresa.id, false);
};

window.guardarEdicionEmpresa = async () => {
    currentEmpresa.nombre = document.getElementById('edit-nombre').value;
    currentEmpresa.tipo = document.getElementById('edit-tipo').value;
    currentEmpresa.nit = document.getElementById('edit-nit').value;
    currentEmpresa.telefono = document.getElementById('edit-telefono').value;
    currentEmpresa.email_general = document.getElementById('edit-email').value;
    currentEmpresa.pagina_web = document.getElementById('edit-web').value;
    currentEmpresa.tags = pendingTags;

    await CRMService.saveEmpresa(currentEmpresa);

    // Save relations
    // First delete old ones
    const oldRels = await CRMService.getRelacionesDeEmpresa(currentEmpresa.id);
    for (let r of oldRels) await CRMService.deleteRelacion(r.id);

    // Add new ones
    for (let r of pendingRelaciones) {
        await CRMService.saveRelacion({
            fabricanteId: currentEmpresa.tipo === 'fabricante' ? currentEmpresa.id : r.empresaId,
            distribuidorId: currentEmpresa.tipo === 'fabricante' ? r.empresaId : currentEmpresa.id,
            preferente: !!r.preferente
        });
    }

    showToast('Empresa actualizada', 'success');
    renderFichaEmpresa(currentEmpresa.id, false); // Reload read mode
    const app = document.querySelector('.nav-tab.active');
    if(app) app.click(); // reload background list
};

window.removeTag = (index) => {
    pendingTags.splice(index, 1);
    renderFichaEmpresa(currentEmpresa.id, true);
};

window.removeRelacion = (index) => {
    pendingRelaciones.splice(index, 1);
    renderFichaEmpresa(currentEmpresa.id, true);
};

window.abrirOtraFicha = (id) => {
    window.closeAllModals();
    document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id } }));
};

function setupAutocompleteTags() {
    const input = document.getElementById('tag-input');
    const dropdown = document.getElementById('tag-dropdown');
    
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (!val) {
            dropdown.classList.remove('active');
            return;
        }
        const matches = allTags.filter(t => t.toLowerCase().includes(val) && !pendingTags.includes(t));
        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(m => `<div class="autocomplete-item" onclick="window.addTag('${escapeHtml(m)}')">${escapeHtml(m)}</div>`).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.innerHTML = `<div class="autocomplete-item text-muted">Presiona Enter para crear "${escapeHtml(val)}"</div>`;
            dropdown.classList.add('active');
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = input.value.trim();
            if (val && !pendingTags.includes(val)) {
                window.addTag(val);
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

window.addTag = (tag) => {
    if (!pendingTags.includes(tag)) {
        pendingTags.push(tag);
        if(!allTags.includes(tag)) allTags.push(tag);
    }
    renderFichaEmpresa(currentEmpresa.id, true);
};

function setupAutocompleteRelaciones() {
    const input = document.getElementById('relacion-input');
    const dropdown = document.getElementById('relacion-dropdown');
    const currentTipo = document.getElementById('edit-tipo').value;

    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (!val) {
            dropdown.classList.remove('active');
            return;
        }
        
        let validTypes = [];
        if (currentTipo === 'fabricante') validTypes = ['distribuidor', 'proveedor'];
        else if (currentTipo === 'distribuidor') validTypes = ['fabricante'];
        else validTypes = ['fabricante', 'distribuidor', 'proveedor', 'otros']; // if proveedor/otros can relate to anything

        const matches = allEmpresas.filter(emp => 
            emp.id !== currentEmpresa.id && 
            emp.nombre.toLowerCase().includes(val) &&
            validTypes.includes(emp.tipo) &&
            !pendingRelaciones.find(r => r.empresaId === emp.id)
        );

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(m => `<div class="autocomplete-item" onclick="window.addRelacion(${m.id})">${escapeHtml(m.nombre)} <small>(${m.tipo})</small></div>`).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.innerHTML = `<div class="autocomplete-item text-muted">No se encontraron sugerencias válidas.</div>`;
            dropdown.classList.add('active');
        }
    });

    // Cambiar tipo debe reiniciar las relaciones si no son válidas? Mejor dejarlo manual.
    document.getElementById('edit-tipo').addEventListener('change', () => {
        // Al cambiar de tipo, las sugerencias cambiarán, pero las ya agregadas se guardarán bajo el nuevo contexto.
    });

    document.addEventListener('click', (e) => {
        if (input && !input.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

window.addRelacion = (empresaId) => {
    const emp = allEmpresas.find(e => e.id === empresaId);
    if (emp) {
        const currentTipo = document.getElementById('edit-tipo').value;
        pendingRelaciones.push({
            empresaId: emp.id,
            rol: currentTipo === 'fabricante' ? 'Distribuidor' : 'Fabricante',
            preferente: false
        });
        renderFichaEmpresa(currentEmpresa.id, true);
    }
};
