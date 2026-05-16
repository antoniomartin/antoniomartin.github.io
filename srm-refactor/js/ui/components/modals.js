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
}

export function openEmpresaModal() {
    const body = `
        <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input type="text" name="nombre" class="form-input" required>
        </div>
        <div class="form-group">
            <label class="form-label">Tipo</label>
            <select name="tipo" class="form-select">
                <option value="fabricante">🏭 Fabricante</option>
                <option value="distribuidor">🚚 Distribuidor</option>
                <option value="proveedor">📦 Proveedor</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">NIT</label>
            <input type="text" name="nit" class="form-input">
        </div>
    `;
    window.openModal('➕ Nueva Empresa', body, async (data) => {
        data.estado = 'activo';
        data.tags = [];
        await CRMService.saveEmpresa(data);
        showToast('Empresa creada con éxito', 'success');
    });
}

export async function openContactoModal() {
    const empresas = await CRMService.getEmpresas();
    if (empresas.length === 0) {
        showToast('Debes crear al menos una empresa primero', 'error');
        return;
    }

    const options = empresas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
    
    const body = `
        <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input type="text" name="nombre" class="form-input" required>
        </div>
        <div class="form-group">
            <label class="form-label">Empresa *</label>
            <select name="empresaId" class="form-select" required>
                ${options}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Cargo</label>
            <input type="text" name="cargo" class="form-input">
        </div>
    `;
    window.openModal('➕ Nuevo Contacto', body, async (data) => {
        data.empresaId = parseInt(data.empresaId);
        data.estado = 'activo';
        await CRMService.saveContacto(data);
        showToast('Contacto creado con éxito', 'success');
    });
}

export async function openInteraccionModal() {
    const contactos = await CRMService.getContactos();
    if (contactos.length === 0) {
        showToast('Debes crear al menos un contacto primero', 'error');
        return;
    }

    const options = contactos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    const body = `
        <div class="form-group">
            <label class="form-label">Asunto *</label>
            <input type="text" name="asunto" class="form-input" required>
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
                <option value="reunion">🤝 Reunión</option>
                <option value="llamada">📞 Llamada</option>
                <option value="email">✉️ Correo</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="datetime-local" name="fecha" class="form-input" required>
        </div>
    `;
    window.openModal('➕ Nueva Interacción', body, async (data) => {
        data.contactoId = parseInt(data.contactoId);
        data.estado = 'pendiente';
        if (!data.fecha) data.fecha = new Date().toISOString();
        await CRMService.saveInteraccion(data);
        showToast('Interacción registrada', 'success');
    });
}
