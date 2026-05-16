import { CRMService } from '../../services/crmService.js';
import { escapeHtml } from '../../utils/helpers.js';

export async function renderEmpresas(container) {
    container.innerHTML = '<div class="loading-state">Cargando empresas...</div>';
    
    try {
        const empresas = await CRMService.getEmpresas();
        const contactos = await CRMService.getContactos();
        
        if (empresas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏢</div>
                    <h3>No hay empresas registradas</h3>
                    <p>Haz clic en "Nueva Empresa" para comenzar.</p>
                </div>`;
            return;
        }

        const gridHtml = `<div class="grid-view">
            ${empresas.map(emp => {
                const numContactos = contactos.filter(c => c.empresaId === emp.id).length;
                const icono = emp.tipo === 'fabricante' ? '🏭' : emp.tipo === 'distribuidor' ? '🚚' : '📦';
                const estadoClass = emp.estado === 'activo' ? 'badge-active' : 'badge-inactive';
                const estadoText = emp.estado === 'activo' ? 'Activo' : 'Inactivo';
                
                return `
                <div class="card" data-id="${emp.id}">
                    <div class="card-header">
                        <div class="card-title">${icono} ${escapeHtml(emp.nombre)}</div>
                        <span class="badge ${estadoClass}">${estadoText}</span>
                    </div>
                    <div class="card-body">
                        <div class="card-info-line">📄 NIT: ${escapeHtml(emp.nit || 'Sin NIT')}</div>
                        <div class="card-info-line">👥 ${numContactos} Contacto(s)</div>
                        <div class="card-info-line">🏷️ ${escapeHtml(emp.tipo || 'General')}</div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;

        container.innerHTML = gridHtml;

        // Añadir Event Listeners (Delegación de eventos para mejor rendimiento)
        container.querySelector('.grid-view').addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const id = parseInt(card.getAttribute('data-id'));
                // Aquí se llamaría a la función global para abrir la ficha
                document.dispatchEvent(new CustomEvent('abrirFichaEmpresa', { detail: { id } }));
            }
        });

    } catch (error) {
        container.innerHTML = `<div class="toast toast-error">Error al cargar empresas: ${error.message}</div>`;
    }
}
