import { renderEmpresas } from './components/empresas.js';
import { renderContactos } from './components/contactos.js';
import { renderInteracciones } from './components/interacciones.js';
import { CRMService } from '../services/crmService.js';
import { setupModals, openEmpresaModal, openContactoModal, openInteraccionModal } from './components/modals.js';

class AppController {
    constructor() {
        this.currentTab = 'empresas';
        this.container = document.getElementById('data-container');
        this.statsContainer = document.getElementById('stats-container');
        this.toolbar = document.getElementById('toolbar');
        setupModals(this); // Inicializar contenedor de modales
        this.initEventListeners();
        this.renderCurrentTab();
        this.updateStats();
    }

    initEventListeners() {
        // Tabs
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.getAttribute('data-tab');
                this.renderCurrentTab();
            });
        });

        // Custom Events para Fichas (Modales)
        document.addEventListener('abrirFichaEmpresa', (e) => {
            console.log('Abrir ficha empresa ID:', e.detail.id);
            // TODO: Implementar lógica del modal
            alert(`Implementación de Ficha Empresa ID: ${e.detail.id} en curso...`);
        });
        
        document.addEventListener('abrirFichaContacto', (e) => {
            console.log('Abrir ficha contacto ID:', e.detail.id);
            alert(`Implementación de Ficha Contacto ID: ${e.detail.id} en curso...`);
        });

        document.addEventListener('abrirFichaInteraccion', (e) => {
            console.log('Abrir ficha interaccion ID:', e.detail.id);
            alert(`Implementación de Ficha Interaccion ID: ${e.detail.id} en curso...`);
        });
    }

    renderToolbar() {
        let actionBtn = '';
        if (this.currentTab === 'empresas') {
            actionBtn = `<button id="btn-add-empresa" class="btn btn-primary">➕ Nueva Empresa</button>`;
        } else if (this.currentTab === 'contactos') {
            actionBtn = `<button id="btn-add-contacto" class="btn btn-primary">➕ Nuevo Contacto</button>`;
        } else {
            actionBtn = `<button id="btn-add-inter" class="btn btn-primary">➕ Nueva Interacción</button>`;
        }

        this.toolbar.innerHTML = `
            <div>${actionBtn}</div>
            <div>
                <button class="btn btn-outline" onclick="alert('Función de exportar pendiente')">📊 Exportar</button>
            </div>
        `;

        // Bind events to the newly created buttons
        const btnEmpresa = document.getElementById('btn-add-empresa');
        if (btnEmpresa) btnEmpresa.addEventListener('click', openEmpresaModal);

        const btnContacto = document.getElementById('btn-add-contacto');
        if (btnContacto) btnContacto.addEventListener('click', openContactoModal);

        const btnInter = document.getElementById('btn-add-inter');
        if (btnInter) btnInter.addEventListener('click', openInteraccionModal);
    }

    async renderCurrentTab() {
        this.renderToolbar();
        
        switch(this.currentTab) {
            case 'empresas':
                await renderEmpresas(this.container);
                break;
            case 'contactos':
                await renderContactos(this.container);
                break;
            case 'interacciones':
                await renderInteracciones(this.container);
                break;
        }
    }

    async updateStats() {
        try {
            const e = await CRMService.getEmpresas();
            const c = await CRMService.getContactos();
            const i = await CRMService.getInteracciones();
            
            const pendientes = i.filter(inter => inter.estado === 'pendiente').length;

            this.statsContainer.innerHTML = `
                🏢 ${e.length} Empresas | 
                👥 ${c.length} Contactos | 
                💬 ${i.length} Interacciones | 
                ⏳ <strong style="color:var(--color-warning)">${pendientes} Pendientes</strong>
            `;
        } catch (error) {
            this.statsContainer.innerHTML = 'Error al cargar estadísticas';
        }
    }
}

export function initApp() {
    new AppController();
}
