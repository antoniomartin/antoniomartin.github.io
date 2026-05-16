import { initDB } from './db/indexedDB.js';
import { initApp } from './ui/app.js';
import { showToast } from './utils/helpers.js';

// Inicialización global de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Inicializar la Base de Datos
        await initDB();
        console.log("Base de datos inicializada correctamente.");
        
        // 2. Iniciar la Interfaz de Usuario
        initApp();
        
        // 3. Notificar éxito
        showToast('¡Sistema listo!', 'success');
        
    } catch (error) {
        console.error("Error crítico durante la inicialización:", error);
        document.body.innerHTML = `
            <div style="padding: 2rem; color: red; font-family: sans-serif; text-align: center;">
                <h2>Error Fatal</h2>
                <p>No se pudo iniciar la aplicación: ${error.message || error}</p>
            </div>
        `;
    }
});
