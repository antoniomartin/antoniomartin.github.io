import { CRMService } from '../services/crmService.js';

export async function seedDatabase() {
    try {
        const existing = await CRMService.getEmpresas();
        if (existing.length > 0) {
            console.log("La base de datos ya tiene información, omitiendo datos de prueba.");
            return;
        }

        console.log("Inyectando datos de prueba...");

        // 1. Crear Empresas
        const e1 = await CRMService.saveEmpresa({
            nombre: "TechCorp Fabricaciones S.L.",
            tipo: "fabricante",
            nit: "B-12345678",
            estado: "activo"
        });

        const e2 = await CRMService.saveEmpresa({
            nombre: "Logística Global Distribuciones",
            tipo: "distribuidor",
            nit: "A-87654321",
            estado: "activo"
        });

        const e3 = await CRMService.saveEmpresa({
            nombre: "Servicios IT Innovadores",
            tipo: "proveedor",
            nit: "C-11223344",
            estado: "inactivo"
        });

        // 2. Crear Contactos (Con Jerarquía)
        const c1 = await CRMService.saveContacto({
            nombre: "Ana Martínez",
            empresaId: e1.id,
            cargo: "Directora de Operaciones",
            email: "ana@techcorp.com",
            estado: "activo",
            reporta_a: null
        });

        const c2 = await CRMService.saveContacto({
            nombre: "Carlos Gómez",
            empresaId: e1.id,
            cargo: "Ingeniero Jefe",
            email: "carlos@techcorp.com",
            estado: "activo",
            reporta_a: c1.id // Reporta a Ana
        });

        const c3 = await CRMService.saveContacto({
            nombre: "Laura Fernández",
            empresaId: e2.id,
            cargo: "Gerente de Ventas",
            email: "laura@logistica.com",
            estado: "activo",
            reporta_a: null
        });

        const c4 = await CRMService.saveContacto({
            nombre: "Roberto Silva",
            empresaId: e3.id,
            cargo: "Soporte Técnico",
            email: "roberto@serviciosit.com",
            estado: "activo",
            reporta_a: null
        });

        const c5 = await CRMService.saveContacto({
            nombre: "Elena Torres",
            empresaId: e1.id,
            cargo: "Ingeniero Junior",
            email: "elena@techcorp.com",
            estado: "activo",
            reporta_a: c2.id // Reporta a Carlos
        });

        // 3. Crear Relaciones N:M (Fabricante - Distribuidor)
        await CRMService.saveRelacion({
            fabricanteId: e1.id,
            distribuidorId: e2.id,
            preferente: true
        });

        // 3. Crear Interacciones
        const now = new Date();
        const ayer = new Date(now); ayer.setDate(ayer.getDate() - 1);
        const mañana = new Date(now); mañana.setDate(mañana.getDate() + 1);

        await CRMService.saveInteraccion({
            asunto: "Presentación del nuevo catálogo",
            contactoId: c1.id,
            tipo: "reunion",
            fecha: ayer.toISOString(),
            estado: "completada"
        });

        await CRMService.saveInteraccion({
            asunto: "Negociación de tarifas logísticas",
            contactoId: c3.id,
            tipo: "llamada",
            fecha: now.toISOString(),
            estado: "completada"
        });

        await CRMService.saveInteraccion({
            asunto: "Revisión de SLA de servidores",
            contactoId: c4.id,
            tipo: "email",
            fecha: mañana.toISOString(),
            estado: "pendiente"
        });

        await CRMService.saveInteraccion({
            asunto: "Visita técnica a la planta",
            contactoId: c2.id,
            tipo: "reunion",
            fecha: mañana.toISOString(),
            estado: "pendiente"
        });

        console.log("Datos de prueba creados exitosamente.");
    } catch (error) {
        console.error("Error al inyectar datos de prueba:", error);
    }
}
