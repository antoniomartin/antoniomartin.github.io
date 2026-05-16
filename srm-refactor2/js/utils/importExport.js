import { CRMService } from '../services/crmService.js';
import * as db from '../db/indexedDB.js';
import { showToast } from './helpers.js';

export async function exportToExcel() {
    try {
        const empresas = await CRMService.getEmpresas();
        const contactos = await CRMService.getContactos();
        const interacciones = await CRMService.getInteracciones();
        const relaciones = await CRMService.getRelaciones();

        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empresas), "empresas");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contactos), "contactos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(interacciones), "interacciones");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(relaciones), "relaciones");

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `CRM_Export_${dateStr}.xlsx`);
        
        showToast('Exportación completada', 'success');
    } catch (error) {
        console.error(error);
        showToast('Error al exportar: ' + error.message, 'error');
    }
}

export async function importFromExcel(file, onComplete) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const processSheet = async (sheetName, storeName) => {
                if (workbook.Sheets[sheetName]) {
                    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    for (const row of rows) {
                        await db.save(storeName, row);
                    }
                }
            };

            await processSheet('empresas', 'empresas');
            await processSheet('contactos', 'contactos');
            await processSheet('interacciones', 'interacciones');
            await processSheet('relaciones', 'relaciones');

            showToast('Importación completada con éxito', 'success');
            if (onComplete) onComplete();
        } catch (error) {
            console.error(error);
            showToast('Error al importar: revisa el formato del archivo', 'error');
        }
    };
    reader.onerror = () => showToast('Error al leer el archivo', 'error');
    reader.readAsArrayBuffer(file);
}
