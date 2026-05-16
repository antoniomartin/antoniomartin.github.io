import { CRMService } from '../../services/crmService.js';
import { showToast } from '../../utils/helpers.js';

export function setupModals(appController) {
    const modalContainer = document.getElementById('modal-container');

    // Función global para abrir cualquier modal
    window.openModal = (title, bodyHtml, onSave) => {
        const modalId = 'modal-' + Date.now();
        const modalHtml = `
            <div class="modal-overlay active" id="${modalId}">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                        <button class="btn-icon" onclick="closeModal('${modalId}')">❌</button>
                    </div>
                    <div class="modal-body">
                        <form id="form-${modalId}">
                            ${bodyHtml}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal('${modalId}')">Cancelar</button>
                        <button type="submit" form="form-${modalId}" class="btn btn-primary">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        modalContainer.insertAdjacentHTML('beforeend', modalHtml);

        const form = document.getElementById(`form-${modalId}`);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            try {
                await onSave(data);
                closeModal(modalId);
                appController.renderCurrentTab(); // Recargar la vista actual
                appController.updateStats();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    };
    
    // Función global para cerrar todos los modales (útil al editar desde una ficha)
    window.closeAllModals = () => {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.classList.remove('active');
            setTimeout(() => m.remove(), 300);
        });
    };
}

export function openEmpresaModal(empresa = null) {
    const isEdit = !!empresa;
    const body = `
        <input type="hidden" name="id" value="${empresa?.id || ''}">
        <input type="hidden" name="fecha_creacion" value="${empresa?.fecha_creacion || ''}">
        <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input type="text" name="nombre" class="form-input" required value="${empresa?.nombre || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Tipo</label>
            <select name="tipo" class="form-select">
                <option value="fabricante" ${empresa?.tipo === 'fabricante' ? 'selected' : ''}>🏭 Fabricante</option>
                <option value="distribuidor" ${empresa?.tipo === 'distribuidor' ? 'selected' : ''}>🚚 Distribuidor</option>
                <option value="proveedor" ${empresa?.tipo === 'proveedor' ? 'selected' : ''}>📦 Proveedor de servicios</option>
                <option value="otros" ${empresa?.tipo === 'otros' ? 'selected' : ''}>⚪ Otros</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">NIT</label>
            <input type="text" name="nit" class="form-input" value="${empresa?.nit || ''}">
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" name="telefono" class="form-input" value="${empresa?.telefono || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Email General</label>
                <input type="email" name="email_general" class="form-input" value="${empresa?.email_general || ''}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Página Web</label>
            <input type="url" name="pagina_web" class="form-input" value="${empresa?.pagina_web || ''}">
        </div>
    `;
    window.openModal(isEdit ? '✏️ Editar Empresa' : '➕ Nueva Empresa', body, async (data) => {
        if (data.id) data.id = parseInt(data.id); else delete data.id;
        data.estado = empresa?.estado || 'activo';
        if (!data.fecha_creacion) delete data.fecha_creacion;
        await CRMService.saveEmpresa(data);
        showToast(isEdit ? 'Empresa actualizada' : 'Empresa creada con éxito', 'success');
        if (isEdit) {
            window.closeAllModals();
            document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id: data.id } }));
        }
    });
}

export async function openContactoModal(contacto = null) {
    const isEdit = !!contacto;
    const empresas = await CRMService.getEmpresas();
    const contactos = await CRMService.getContactos();
    
    if (empresas.length === 0) {
        showToast('Debes crear al menos una empresa primero', 'error');
        return;
    }

    const optionsEmpresas = empresas.map(e => `<option value="${e.id}" ${contacto?.empresaId === e.id ? 'selected' : ''}>${escapeHtml(e.nombre)}</option>`).join('');
    const optionsContactos = '<option value="">(Ninguno)</option>' + contactos.map(c => `<option value="${c.id}" ${contacto?.reporta_a === c.id ? 'selected' : ''}>${escapeHtml(c.nombre)} (${escapeHtml(empresas.find(e => e.id === c.empresaId)?.nombre || '')})</option>`).join('');
    
    const body = `
        <input type="hidden" name="id" value="${contacto?.id || ''}">
        <input type="hidden" name="fecha_creacion" value="${contacto?.fecha_creacion || ''}">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" name="nombre" class="form-input" required value="${contacto?.nombre || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-input" value="${contacto?.email || ''}">
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
                <label class="form-label">Empresa Actual *</label>
                <select name="empresaId" class="form-select" required>
                    ${optionsEmpresas}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Cargo</label>
                <input type="text" name="cargo" class="form-input" value="${contacto?.cargo || ''}">
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
                <label class="form-label">Reporta a:</label>
                <select name="reporta_a" class="form-select">
                    ${optionsContactos}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">LinkedIn</label>
                <input type="url" name="linkedin" class="form-input" value="${contacto?.linkedin || ''}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Conocido en la empresa:</label>
            <input type="text" name="empresa_usuario_conocido" class="form-input" placeholder="Ej: TechCorp (Tu empresa anterior)" value="${contacto?.empresa_usuario_conocido || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Empresas anteriores del contacto</label>
            <input type="text" name="empresas_anteriores" class="form-input" placeholder="Ej: Google, Microsoft" value="${contacto?.empresas_anteriores || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Intereses (Networking)</label>
            <input type="text" name="intereses" class="form-input" placeholder="Ej: IA, Inversiones, Golf" value="${contacto?.intereses || ''}">
        </div>
    `;
    window.openModal(isEdit ? '✏️ Editar Contacto' : '➕ Nuevo Contacto', body, async (data) => {
        if (data.id) data.id = parseInt(data.id); else delete data.id;
        data.empresaId = parseInt(data.empresaId);
        data.reporta_a = data.reporta_a ? parseInt(data.reporta_a) : null;
        data.estado = contacto?.estado || 'activo';
        if (!data.fecha_creacion) delete data.fecha_creacion;
        await CRMService.saveContacto(data);
        showToast(isEdit ? 'Contacto actualizado' : 'Contacto creado con éxito', 'success');
        if (isEdit) {
            window.closeAllModals();
            document.dispatchEvent(new CustomEvent('abrirFichaContacto', { detail: { id: data.id } }));
        }
    });
}

export async function openInteraccionModal(interaccion = null) {
    const isEdit = !!interaccion;
    const contactos = await CRMService.getContactos();
    if (contactos.length === 0) {
        showToast('Debes crear al menos un contacto primero', 'error');
        return;
    }

    const options = contactos.map(c => `<option value="${c.id}" ${interaccion?.contactoId === c.id ? 'selected' : ''}>${escapeHtml(c.nombre)}</option>`).join('');

    // Format date for datetime-local
    let fechaValue = '';
    if (interaccion?.fecha) {
        const d = new Date(interaccion.fecha);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        fechaValue = d.toISOString().slice(0,16);
    }

    const body = `
        <input type="hidden" name="id" value="${interaccion?.id || ''}">
        <div class="form-group">
            <label class="form-label">Asunto *</label>
            <input type="text" name="asunto" class="form-input" required value="${interaccion?.asunto || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Contacto *</label>
            <select name="contactoId" class="form-select" required>
                ${options}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Tipo</label>
            <select name="tipo" class="form-select">
                <option value="reunion" ${interaccion?.tipo === 'reunion' ? 'selected' : ''}>🤝 Reunión</option>
                <option value="llamada" ${interaccion?.tipo === 'llamada' ? 'selected' : ''}>📞 Llamada</option>
                <option value="email" ${interaccion?.tipo === 'email' ? 'selected' : ''}>✉️ Correo</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="datetime-local" name="fecha" class="form-input" required value="${fechaValue}">
        </div>
        <div class="form-group">
            <label class="form-label">Estado</label>
            <select name="estado" class="form-select">
                <option value="pendiente" ${interaccion?.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                <option value="completada" ${interaccion?.estado === 'completada' ? 'selected' : ''}>✅ Completada</option>
            </select>
        </div>
    `;
    window.openModal(isEdit ? '✏️ Editar Interacción' : '➕ Nueva Interacción', body, async (data) => {
        if (data.id) data.id = parseInt(data.id); else delete data.id;
        data.contactoId = parseInt(data.contactoId);
        if (!data.fecha) data.fecha = new Date().toISOString();
        else data.fecha = new Date(data.fecha).toISOString();
        
        await CRMService.saveInteraccion(data);
        showToast(isEdit ? 'Interacción actualizada' : 'Interacción registrada', 'success');
        if (isEdit) {
            window.closeAllModals();
            document.dispatchEvent(new CustomEvent('abrirFichaInteraccion', { detail: { id: data.id } }));
        }
    });
}

