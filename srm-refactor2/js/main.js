import { initDB } from './db/indexedDB.js';
import { initApp } from './ui/app.js';
import { showToast } from './utils/helpers.js';
import { seedDatabase } from './utils/seed.js';

// Inicialización global de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Inicializar la Base de Datos
        await initDB();
        console.log("Base de datos inicializada correctamente.");
        
        // 1.5 Cargar datos de prueba si la base está vacía
        await seedDatabase();
        
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

// Función de utilidad para forzar el reseteo de la base de datos (para ver los nuevos datos de prueba)
window.resetApp = async () => {
    if (confirm("¿Estás seguro de que deseas borrar toda la base de datos y cargar los datos de prueba nuevamente?")) {
        indexedDB.deleteDatabase('NexCRM_DB');
        alert("Base de datos borrada. Recargando la página...");
        window.location.reload();
    }
};
