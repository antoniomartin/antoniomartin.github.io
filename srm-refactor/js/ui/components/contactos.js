import { CRMService } from '../../services/crmService.js';
import { escapeHtml } from '../../utils/helpers.js';

export async function renderContactos(container) {
    container.innerHTML = '<div class="loading-state">Cargando contactos...</div>';
    
    try {
        const contactos = await CRMService.getContactos();
        const empresas = await CRMService.getEmpresas();
        
        if (contactos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <h3>No hay contactos registrados</h3>
                    <p>Crea un contacto desde la pestaña Contactos o desde la ficha de una empresa.</p>
                </div>`;
            return;
        }

        const gridHtml = `<div class="grid-view">
            ${contactos.map(cont => {
                const empresa = empresas.find(e => e.id === cont.empresaId);
                const nombreEmpresa = empresa ? escapeHtml(empresa.nombre) : 'Sin empresa';
                
                return `
                <div class="card" data-id="${cont.id}">
                    <div class="card-header">
                        <div class="card-title">👤 ${escapeHtml(cont.nombre)}</div>
                    </div>
                    <div class="card-body">
                        <div class="card-info-line">🏢 ${nombreEmpresa}</div>
                        <div class="card-info-line">💼 ${escapeHtml(cont.cargo || 'Sin cargo')}</div>
                        ${cont.email ? `<div class="card-info-line">✉️ ${escapeHtml(cont.email)}</div>` : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>`;

        container.innerHTML = gridHtml;

        container.querySelector('.grid-view').addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const id = parseInt(card.getAttribute('data-id'));
                document.dispatchEvent(new CustomEvent('abrirFichaContacto', { detail: { id } }));
            }
        });

    } catch (error) {
        container.innerHTML = `<div class="toast toast-error">Error al cargar contactos: ${error.message}</div>`;
    }
}
