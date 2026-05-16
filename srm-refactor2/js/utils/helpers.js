// Utilidad para evitar XSS
export function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Sistema de Notificaciones (Toasts)
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    
    container.appendChild(toast);
    
    // Animar entrada
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remover después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Esperar a que termine la transición
    }, 3000);
}

// Formateador de fechas
export function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Generador de IDs únicos (para uso temporal si no se tiene ID de BD)
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
