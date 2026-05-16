import { CRMService } from '../../services/crmService.js';
import { escapeHtml, formatDate } from '../../utils/helpers.js';

export async function renderInteracciones(container) {
    container.innerHTML = '<div class="loading-state">Cargando interacciones...</div>';
    
    try {
        const interacciones = await CRMService.getInteracciones();
        const contactos = await CRMService.getContactos();
        
        if (interacciones.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
                    <h3>No hay interacciones registradas</h3>
                </div>`;
            return;
        }

        // Ordenar por fecha descendente
        interacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        const listHtml = `<div style="display:flex; flex-direction:column; gap:1rem;">
            ${interacciones.map(inter => {
                const contacto = contactos.find(c => c.id === inter.contactoId);
                const nombreContacto = contacto ? escapeHtml(contacto.nombre) : 'Desconocido';
                
                const icon = inter.tipo === 'reunion' ? '🤝' : inter.tipo === 'llamada' ? '📞' : inter.tipo === 'email' ? '✉️' : '🏢';
                const estadoClass = inter.estado === 'pendiente' ? 'badge-pending' : 'badge-active';
                const estadoText = inter.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Completada';
                
                return `
                <div class="card" data-id="${inter.id}" style="flex-direction:row; align-items:center;">
                    <div style="font-size:2rem; padding:0 1rem;">${icon}</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <strong>${escapeHtml(inter.asunto)}</strong>
                            <span class="badge ${estadoClass}">${estadoText}</span>
                        </div>
                        <div class="card-info-line">👤 ${nombreContacto} | 📅 ${formatDate(inter.fecha)}</div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;

        container.innerHTML = listHtml;

        container.querySelector('div').addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const id = parseInt(card.getAttribute('data-id'));
                document.dispatchEvent(new CustomEvent('abrirFichaInteraccion', { detail: { id } }));
            }
        });

    } catch (error) {
        container.innerHTML = `<div class="toast toast-error">Error al cargar interacciones: ${error.message}</div>`;
    }
}
