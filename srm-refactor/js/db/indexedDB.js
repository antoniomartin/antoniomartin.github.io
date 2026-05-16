/**
 * Wrapper de IndexedDB usando Promesas para manejo asíncrono limpio.
 */

const DB_NAME = 'NexCRM_DB';
const DB_VERSION = 1;

let dbInstance = null;

export async function initDB() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject("No se pudo abrir la base de datos.");
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Definición de esquemas de tablas (Object Stores)
            if (!db.objectStoreNames.contains('empresas')) {
                db.createObjectStore('empresas', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('contactos')) {
                const store = db.createObjectStore('contactos', { keyPath: 'id', autoIncrement: true });
                store.createIndex('empresaId', 'empresaId', { unique: false });
            }
            if (!db.objectStoreNames.contains('interacciones')) {
                const store = db.createObjectStore('interacciones', { keyPath: 'id', autoIncrement: true });
                store.createIndex('contactoId', 'contactoId', { unique: false });
            }
            if (!db.objectStoreNames.contains('relaciones')) {
                db.createObjectStore('relaciones', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Función genérica para obtener todos los registros de un store
export async function getAll(storeName) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Función genérica para obtener un registro por ID
export async function getById(storeName, id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función genérica para guardar (crear o actualizar) un registro
export async function save(storeName, item) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        let request;
        if (item.id) {
            request = store.put(item); // Actualiza si tiene ID
        } else {
            request = store.add(item); // Crea si no tiene ID
        }

        request.onsuccess = (e) => {
            // Devolver el objeto guardado (con su nuevo ID si fue creado)
            resolve({ ...item, id: e.target.result }); 
        };
        request.onerror = () => reject(request.error);
    });
}

// Función genérica para eliminar un registro
export async function remove(storeName, id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// Función para obtener registros por un índice (ej. contactos de una empresa)
export async function getByIndex(storeName, indexName, value) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}
