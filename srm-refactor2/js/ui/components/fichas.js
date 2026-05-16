import { CRMService } from '../../services/crmService.js';
import { escapeHtml } from '../../utils/helpers.js';

export async function renderFichaEmpresa(id) {
    try {
        const empresa = await CRMService.getEmpresas().then(res => res.find(e => e.id === id));
        if (!empresa) throw new Error("Empresa no encontrada");

        const contactos = await CRMService.getContactos().then(res => res.filter(c => c.empresaId === id));
        const interacciones = await CRMService.getInteraccionesDeEmpresa(id);
        const relaciones = await CRMService.getRelacionesDeEmpresa(id);
        const empresas = await CRMService.getEmpresas(); // Para sacar los nombres en las relaciones

        const icono = empresa.tipo === 'fabricante' ? '🏭' : empresa.tipo === 'distribuidor' ? '🚚' : '📦';
        const estadoClass = empresa.estado === 'activo' ? 'badge-active' : 'badge-inactive';

        // 1. Relaciones HTMl
        let relacionesHtml = '<p class="text-muted">No hay asociaciones registradas.</p>';
        if (relaciones.length > 0) {
            relacionesHtml = relaciones.map(r => {
                const esFabricante = r.fabricanteId === id;
                const otraEmpresaId = esFabricante ? r.distribuidorId : r.fabricanteId;
                const otraEmpresa = empresas.find(e => e.id === otraEmpresaId);
                const tipoRel = esFabricante ? 'Distribuidor' : 'Fabricante';
                return `<div class="card-info-line">
                    🔗 ${tipoRel}: <strong>${otraEmpresa ? escapeHtml(otraEmpresa.nombre) : 'Desconocida'}</strong> 
                    ${r.preferente ? '<span class="badge badge-pending">Preferente</span>' : ''}
                </div>`;
            }).join('');
        }

        // 2. Organigrama (Árbol) HTML
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

        // 3. Interacciones HTML
        let interaccionesHtml = '<p class="text-muted">No hay interacciones recientes.</p>';
        if (interacciones.length > 0) {
            interaccionesHtml = interacciones.map(inter => `
                <div class="card-info-line" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <strong>${escapeHtml(inter.asunto)}</strong><br>
                        <small class="text-muted">${new Date(inter.fecha).toLocaleString()} - ${inter.tipo}</small>
                    </div>
                </div>
            `).join('');
        }

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                    <h3 style="margin-bottom: 1rem;">Detalles</h3>
                    <div class="card" style="margin-bottom: 1.5rem;">
                        <div class="card-info-line">🏷️ Tipo: ${escapeHtml(empresa.tipo || 'General')}</div>
                        <div class="card-info-line">📄 NIT: ${escapeHtml(empresa.nit || 'Sin NIT')}</div>
                        <div class="card-info-line">📅 Creada: ${new Date(empresa.fecha_creacion).toLocaleDateString()}</div>
                        <div class="card-info-line">📊 Estado: <span class="badge ${estadoClass}">${empresa.estado}</span></div>
                    </div>
                    
                    <h3 style="margin-bottom: 1rem;">Asociaciones</h3>
                    <div class="card" style="margin-bottom: 1.5rem;">
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

        window.openModal(`${icono} Ficha de Empresa: ${escapeHtml(empresa.nombre)}`, bodyHtml, async () => {
            // No hacemos nada al guardar porque la ficha es solo de lectura por ahora
        });
        
        // Esconder el botón "Guardar" y cambiar "Cancelar" por "Cerrar"
        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay.active');
            const lastModal = modals[modals.length - 1];
            if (lastModal) {
                const saveBtn = lastModal.querySelector('button[type="submit"]');
                const cancelBtn = lastModal.querySelector('button.btn-outline');
                if (saveBtn) saveBtn.style.display = 'none';
                if (cancelBtn) cancelBtn.textContent = 'Cerrar';
                lastModal.querySelector('.modal-content').style.maxWidth = '900px'; // Ficha grande
            }
        }, 50);

    } catch (error) {
        console.error(error);
        alert("Error al cargar la ficha de la empresa.");
    }
}

export async function renderFichaContacto(id) {
    try {
        const contacto = await CRMService.getContactos().then(res => res.find(c => c.id === id));
        if (!contacto) throw new Error("Contacto no encontrado");

        const empresa = await CRMService.getEmpresas().then(res => res.find(e => e.id === contacto.empresaId));
        const interacciones = await CRMService.getInteracciones().then(res => res.filter(i => i.contactoId === id));

        const estadoClass = contacto.estado === 'activo' ? 'badge-active' : 'badge-inactive';

        let interaccionesHtml = '<p class="text-muted">No hay interacciones recientes.</p>';
        if (interacciones.length > 0) {
            interaccionesHtml = interacciones.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(inter => `
                <div class="card-info-line" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <strong>${escapeHtml(inter.asunto)}</strong><br>
                        <small class="text-muted">${new Date(inter.fecha).toLocaleString()} - ${inter.tipo}</small>
                    </div>
                </div>
            `).join('');
        }

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
                <div class="card">
                    <div class="card-info-line">🏢 Empresa: <strong style="cursor:pointer; color:var(--color-primary);" onclick="document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id: ${empresa?.id} } }))">${escapeHtml(empresa?.nombre || 'Desconocida')}</strong></div>
                    <div class="card-info-line">💼 Cargo: ${escapeHtml(contacto.cargo || 'Sin cargo')}</div>
                    <div class="card-info-line">✉️ Email: ${escapeHtml(contacto.email || 'Sin email')}</div>
                    <div class="card-info-line">📊 Estado: <span class="badge ${estadoClass}">${contacto.estado}</span></div>
                </div>
                
                <h3 style="margin-top: 0.5rem;">Interacciones</h3>
                <div class="card" style="max-height: 300px; overflow-y: auto;">
                    ${interaccionesHtml}
                </div>
            </div>
        `;

        window.openModal(`👤 Ficha de Contacto: ${escapeHtml(contacto.nombre)}`, bodyHtml, async () => {
        });

        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay.active');
            const lastModal = modals[modals.length - 1];
            if (lastModal) {
                const saveBtn = lastModal.querySelector('button[type="submit"]');
                const cancelBtn = lastModal.querySelector('button.btn-outline');
                if (saveBtn) saveBtn.style.display = 'none';
                if (cancelBtn) cancelBtn.textContent = 'Cerrar';
            }
        }, 50);

    } catch (error) {
        console.error(error);
        alert("Error al cargar la ficha del contacto.");
    }
}
