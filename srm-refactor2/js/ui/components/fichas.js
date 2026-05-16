import { CRMService } from '../../services/crmService.js';
import { escapeHtml } from '../../utils/helpers.js';
import { openEmpresaModal, openContactoModal, openInteraccionModal } from './modals.js';

window.eliminarEmpresa = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta empresa y todos sus contactos asociados?')) {
        await CRMService.deleteEmpresa(id);
        window.closeAllModals();
        document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id: null } })); // Para que la App recargue
        // Usaremos window.location.reload() por simplicidad para recargar las listas, o mejor:
        const app = document.querySelector('.nav-tab.active');
        if(app) app.click();
    }
};

window.eliminarContacto = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este contacto?')) {
        await CRMService.deleteContacto(id);
        window.closeAllModals();
        const app = document.querySelector('.nav-tab.active');
        if(app) app.click();
    }
};

window.eliminarInteraccion = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta interacción?')) {
        await CRMService.deleteInteraccion(id);
        window.closeAllModals();
        const app = document.querySelector('.nav-tab.active');
        if(app) app.click();
    }
};

window.editarEmpresa = async (id) => {
    const empresa = await CRMService.getEmpresas().then(res => res.find(e => e.id === id));
    if(empresa) {
        window.closeAllModals();
        openEmpresaModal(empresa);
    }
};

window.editarContacto = async (id) => {
    const contacto = await CRMService.getContactos().then(res => res.find(c => c.id === id));
    if(contacto) {
        window.closeAllModals();
        openContactoModal(contacto);
    }
};

window.editarInteraccion = async (id) => {
    const inter = await CRMService.getInteracciones().then(res => res.find(i => i.id === id));
    if(inter) {
        window.closeAllModals();
        openInteraccionModal(inter);
    }
};

export { renderFichaEmpresa } from './fichaEmpresa.js';

export async function renderFichaContacto(id) {
    if (!id) return;
    try {
        const contacto = await CRMService.getContactos().then(res => res.find(c => c.id === id));
        if (!contacto) throw new Error("Contacto no encontrado");

        const empresa = await CRMService.getEmpresas().then(res => res.find(e => e.id === contacto.empresaId));
        const interacciones = await CRMService.getInteracciones().then(res => res.filter(i => i.contactoId === id));

        const estadoClass = contacto.estado === 'activo' ? 'badge-active' : 'badge-inactive';

        let interaccionesHtml = '<p class="text-muted">No hay interacciones recientes.</p>';
        if (interacciones.length > 0) {
            interaccionesHtml = interacciones.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(inter => `
                <div class="card-info-line" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); cursor:pointer;" onclick="document.dispatchEvent(new CustomEvent('abrirFichaInteraccion', { detail: { id: ${inter.id} } }))">
                    <div style="flex:1;">
                        <strong style="color:var(--color-primary);">${escapeHtml(inter.asunto)}</strong><br>
                        <small class="text-muted">${new Date(inter.fecha).toLocaleString()} - ${inter.tipo}</small>
                    </div>
                </div>
            `).join('');
        }

        let linkUrl = contacto.linkedin ? `<a href="${contacto.linkedin}" target="_blank">${escapeHtml(contacto.linkedin)}</a>` : 'No especificado';

        const headerActions = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <h3 style="margin:0;">Información Principal</h3>
                <div>
                    <button class="btn btn-outline" onclick="window.editarContacto(${id})">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="window.eliminarContacto(${id})">🗑️ Eliminar</button>
                </div>
            </div>
        `;

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
                <div>
                    ${headerActions}
                    <div class="card">
                        <div class="card-info-line">🏢 Empresa: <strong style="cursor:pointer; color:var(--color-primary);" onclick="document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id: ${empresa?.id} } }))">${escapeHtml(empresa?.nombre || 'Desconocida')}</strong></div>
                        <div class="card-info-line">💼 Cargo: ${escapeHtml(contacto.cargo || 'Sin cargo')}</div>
                        <div class="card-info-line">✉️ Email: ${escapeHtml(contacto.email || 'Sin email')}</div>
                        <div class="card-info-line">🔗 LinkedIn: ${linkUrl}</div>
                        <div class="card-info-line">📊 Estado: <span class="badge ${estadoClass}">${contacto.estado}</span></div>
                    </div>
                </div>

                <div class="card" style="background-color: var(--bg-surface-hover);">
                    <h4>Contexto de Networking</h4>
                    <div class="card-info-line">📍 Conocido en: <strong>${escapeHtml(contacto.empresa_usuario_conocido || 'No especificado')}</strong></div>
                    <div class="card-info-line">🏢 Empresas Anteriores: ${escapeHtml(contacto.empresas_anteriores || 'No especificado')}</div>
                    <div class="card-info-line">💡 Intereses: ${escapeHtml(contacto.intereses || 'No especificado')}</div>
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

export async function renderFichaInteraccion(id) {
    if (!id) return;
    try {
        const interaccion = await CRMService.getInteracciones().then(res => res.find(i => i.id === id));
        if (!interaccion) throw new Error("Interacción no encontrada");

        const contacto = await CRMService.getContactos().then(res => res.find(c => c.id === interaccion.contactoId));
        const empresa = contacto ? await CRMService.getEmpresas().then(res => res.find(e => e.id === contacto.empresaId)) : null;

        const estadoClass = interaccion.estado === 'pendiente' ? 'badge-pending' : 'badge-active';
        const icon = interaccion.tipo === 'reunion' ? '🤝' : interaccion.tipo === 'llamada' ? '📞' : interaccion.tipo === 'email' ? '✉️' : '🏢';

        const headerActions = `
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-bottom: 1rem;">
                <button class="btn btn-outline" onclick="window.editarInteraccion(${id})">✏️ Editar</button>
                <button class="btn btn-danger" onclick="window.eliminarInteraccion(${id})">🗑️ Eliminar</button>
            </div>
        `;

        const bodyHtml = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${headerActions}
                <div class="card" style="padding: 2rem; text-align:center;">
                    <div style="font-size: 3rem; margin-bottom:1rem;">${icon}</div>
                    <h2>${escapeHtml(interaccion.asunto)}</h2>
                    <div style="margin-top: 0.5rem;"><span class="badge ${estadoClass}">${interaccion.estado}</span></div>
                </div>
                
                <div class="card">
                    <div class="card-info-line">📅 <strong>Fecha:</strong> ${new Date(interaccion.fecha).toLocaleString()}</div>
                    <div class="card-info-line">🏷️ <strong>Tipo:</strong> ${escapeHtml(interaccion.tipo)}</div>
                    <hr style="border:0; border-top:1px solid var(--border-color); margin: 1rem 0;">
                    <div class="card-info-line">👤 <strong>Contacto:</strong> <span style="cursor:pointer; color:var(--color-primary);" onclick="document.dispatchEvent(new CustomEvent('abrirFichaContacto', { detail: { id: ${contacto?.id} } }))">${escapeHtml(contacto?.nombre || 'Desconocido')}</span></div>
                    <div class="card-info-line">🏢 <strong>Empresa:</strong> <span style="cursor:pointer; color:var(--color-primary);" onclick="document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id: ${empresa?.id} } }))">${escapeHtml(empresa?.nombre || 'Desconocida')}</span></div>
                </div>
            </div>
        `;

        window.openModal(`Ficha de Interacción`, bodyHtml, async () => {
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
        alert("Error al cargar la ficha de la interacción.");
    }
}
