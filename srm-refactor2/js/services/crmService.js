import * as db from '../db/indexedDB.js';

/**
 * Capa de Servicios del CRM.
 * Maneja la lógica de negocio, validaciones y reglas de cascada.
 */

export const CRMService = {
    // =========================================
    // EMPRESAS
    // =========================================
    async getEmpresas() {
        return await db.getAll('empresas');
    },

    async saveEmpresa(empresaData) {
        if (!empresaData.nombre) throw new Error("El nombre de la empresa es obligatorio");
        if (!empresaData.fecha_creacion) {
            empresaData.fecha_creacion = new Date().toISOString();
        }
        return await db.save('empresas', empresaData);
    },

    async deleteEmpresa(id) {
        // Lógica de borrado en cascada
        // 1. Obtener contactos de esta empresa
        const contactos = await db.getByIndex('contactos', 'empresaId', id);
        
        // 2. Borrar interacciones de esos contactos
        for (const contacto of contactos) {
            const interacciones = await db.getByIndex('interacciones', 'contactoId', contacto.id);
            for (const inter of interacciones) {
                await db.remove('interacciones', inter.id);
            }
            // 3. Borrar el contacto
            await db.remove('contactos', contacto.id);
        }

        // 4. Borrar relaciones donde sea fabricante o distribuidor
        const relaciones = await db.getAll('relaciones');
        for (const rel of relaciones) {
            if (rel.fabricanteId === id || rel.distribuidorId === id) {
                await db.remove('relaciones', rel.id);
            }
        }

        // Finalmente, borrar la empresa
        return await db.remove('empresas', id);
    },

    // =========================================
    // CONTACTOS
    // =========================================
    async getContactos() {
        return await db.getAll('contactos');
    },

    async saveContacto(contactoData) {
        if (!contactoData.nombre) throw new Error("El nombre del contacto es obligatorio");
        if (!contactoData.empresaId) throw new Error("El contacto debe estar asociado a una empresa");
        if (!contactoData.fecha_creacion) {
            contactoData.fecha_creacion = new Date().toISOString();
        }
        return await db.save('contactos', contactoData);
    },

    async deleteContacto(id) {
        // Borrado en cascada: Borrar interacciones asociadas
        const interacciones = await db.getByIndex('interacciones', 'contactoId', id);
        for (const inter of interacciones) {
            await db.remove('interacciones', inter.id);
        }
        return await db.remove('contactos', id);
    },

    // =========================================
    // INTERACCIONES
    // =========================================
    async getInteracciones() {
        return await db.getAll('interacciones');
    },

    async saveInteraccion(interaccionData) {
        if (!interaccionData.asunto) throw new Error("El asunto es obligatorio");
        if (!interaccionData.contactoId) throw new Error("Debe asociarse a un contacto");
        return await db.save('interacciones', interaccionData);
    },

    async deleteInteraccion(id) {
        return await db.remove('interacciones', id);
    },

    async getInteraccionesDeEmpresa(empresaId) {
        const contactos = await db.getByIndex('contactos', 'empresaId', empresaId);
        let todas = [];
        for (const c of contactos) {
            const inters = await db.getByIndex('interacciones', 'contactoId', c.id);
            todas = todas.concat(inters);
        }
        return todas.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    },

    // =========================================
    // RELACIONES (Fabricante - Distribuidor/etc)
    // =========================================
    async getRelaciones() {
        return await db.getAll('relaciones');
    },

    async saveRelacion(relacionData) {
        if (!relacionData.fabricanteId || !relacionData.distribuidorId) throw new Error("La relación requiere de dos empresas");
        return await db.save('relaciones', relacionData);
    },

    async deleteRelacion(id) {
        return await db.remove('relaciones', id);
    },

    async getRelacionesDeEmpresa(empresaId) {
        const todas = await db.getAll('relaciones');
        return todas.filter(r => r.fabricanteId === empresaId || r.distribuidorId === empresaId);
    }
};
