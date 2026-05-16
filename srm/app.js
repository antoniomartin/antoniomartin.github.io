class CRMApp {
    constructor() {
        this.db = null;
        this.empresas = [];
        this.contactos = [];
        this.interacciones = [];
        this.relaciones = [];
        this.documentos = [];
        this.currentPestana = 'empresas';
        this.currentSort = 'nombre_asc';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filtroActivos = 'todos';
        this.filtrosInteracciones = { tipo: 'todos', estado: 'todos', contactoId: 'todos', busqueda: '', fechaDesde: '', fechaHasta: '' };
        this.charts = {};
        this.modalConfirmacionCallback = null;
    }

    async init() {
        await this.initDB();
        this.setupEventListeners();
        this.renderizarSegunPestana();
        this.actualizarContador();
        if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
        document.getElementById('modoOscuroBtn').onclick = () => this.toggleDarkMode();
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('CRM_Completo_v3', 3);
            request.onerror = () => reject(request.error);
            request.onsuccess = (e) => { this.db = e.target.result; this.cargarDatos().then(resolve); };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('empresas')) db.createObjectStore('empresas', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('contactos')) db.createObjectStore('contactos', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('interacciones')) db.createObjectStore('interacciones', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('relaciones')) db.createObjectStore('relaciones', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('documentos')) db.createObjectStore('documentos', { keyPath: 'id', autoIncrement: true });
                const tx = e.target.transaction;
                this.cargarDatosEjemplo(tx);
            };
        });
    }

    cargarDatosEjemplo(tx) {
        const empresas = [
            { id: 1, nombre: "Maderas del Norte", tipo: "fabricante", estado: "activo", nit: "B12345678", direccion: "Av. Madera 123", telefono: "944123456", email: "info@maderasnorte.com", web: "", notas: "", tags: ["MDF"], fecha_creacion: new Date().toISOString() },
            { id: 2, nombre: "Distribuciones Pino", tipo: "distribuidor", estado: "activo", nit: "B23456789", direccion: "Calle Pino 45", telefono: "911234567", email: "ventas@distpino.com", web: "", notas: "", tags: ["tableros"], fecha_creacion: new Date().toISOString() },
            { id: 3, nombre: "Honeycomb Solutions", tipo: "fabricante", estado: "activo", nit: "B34567890", direccion: "Polígono 78", telefono: "961234567", email: "info@honeycomb.com", web: "", notas: "", tags: ["honeycomb"], fecha_creacion: new Date().toISOString() },
            { id: 4, nombre: "Muebles de Prestigio", tipo: "fabricante", estado: "inactivo", nit: "B45678901", direccion: "Calle Mueble 67", telefono: "931234567", email: "info@mueblesprestigio.com", web: "", notas: "", tags: ["lacas"], fecha_creacion: new Date().toISOString() }
        ];
        const contactos = [
            { id: 1, nombre: "Javier Rodríguez", empresaId: 1, cargo: "CEO", reportaA: null, telefono: "600111222", email: "javier@mn.com", linkedin: "", empresasAnteriores: [], empresaConocido: "", intereses: [], estado: "activo", fecha_creacion: new Date().toISOString() },
            { id: 2, nombre: "Laura Martínez", empresaId: 1, cargo: "Comercial", reportaA: 1, telefono: "600222333", email: "laura@mn.com", linkedin: "", empresasAnteriores: [], empresaConocido: "", intereses: ["ventas"], estado: "activo", fecha_creacion: new Date().toISOString() },
            { id: 3, nombre: "Carlos Méndez", empresaId: 2, cargo: "Gerente", reportaA: null, telefono: "600333444", email: "carlos@dp.com", linkedin: "", empresasAnteriores: [], empresaConocido: "", intereses: [], estado: "activo", fecha_creacion: new Date().toISOString() }
        ];
        const interacciones = [
            { id: 1, contactoId: 1, tipo: "reunion", fecha: new Date().toISOString(), asunto: "Reunión inicial", descripcion: "Presentación", estado: "completada", resolucion: "Acuerdo", archivo: null },
            { id: 2, contactoId: 2, tipo: "llamada", fecha: new Date(Date.now() + 86400000).toISOString(), asunto: "Seguimiento", descripcion: "", estado: "pendiente", resolucion: "", archivo: null }
        ];
        const relaciones = [{ id: 1, fabricanteId: 1, distribuidorId: 2, preferente: "si", notas: "" }];
        const docs = [{ id: 1, empresaId: 1, nombre: "Certificado ISO", url: "#", fecha: new Date().toISOString() }];
        empresas.forEach(e => tx.objectStore('empresas').add(e));
        contactos.forEach(c => tx.objectStore('contactos').add(c));
        interacciones.forEach(i => tx.objectStore('interacciones').add(i));
        relaciones.forEach(r => tx.objectStore('relaciones').add(r));
        docs.forEach(d => tx.objectStore('documentos').add(d));
    }

    async cargarDatos() {
        this.empresas = await this.obtenerTodos('empresas');
        this.contactos = await this.obtenerTodos('contactos');
        this.interacciones = await this.obtenerTodos('interacciones');
        this.relaciones = await this.obtenerTodos('relaciones');
        this.documentos = await this.obtenerTodos('documentos');
        this.renderizarSegunPestana();
        this.actualizarContador();
    }

    obtenerTodos(store) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([store], 'readonly');
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async guardar(store, data, id = null) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([store], 'readwrite');
            const objStore = tx.objectStore(store);
            if (id) { data.id = id; objStore.put(data); }
            else objStore.add(data);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async eliminar(store, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([store], 'readwrite');
            const req = tx.objectStore(store).delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    renderizarSegunPestana() {
        document.getElementById('contentGridContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'none';
        document.getElementById('contentGridContainer').innerHTML = '';
        if (this.currentPestana === 'empresas') this.renderizarEmpresas();
        else if (this.currentPestana === 'contactos') this.renderizarContactos();
        else if (this.currentPestana === 'interacciones') this.renderizarInteracciones();
        else if (this.currentPestana === 'dashboard') this.renderizarDashboard();
    }

    getFiltroActivo(lista) {
        if (this.filtroActivos === 'activos') return lista.filter(e => e.estado === 'activo');
        if (this.filtroActivos === 'inactivos') return lista.filter(e => e.estado === 'inactivo');
        return lista;
    }

    renderizarEmpresas() {
        let lista = this.getFiltroActivo([...this.empresas]);
        if (this.currentSort === 'nombre_asc') lista.sort((a,b)=>a.nombre.localeCompare(b.nombre));
        else if (this.currentSort === 'nombre_desc') lista.sort((a,b)=>b.nombre.localeCompare(a.nombre));
        else if (this.currentSort === 'fecha_asc') lista.sort((a,b)=>new Date(a.fecha_creacion) - new Date(b.fecha_creacion));
        else lista.sort((a,b)=>new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        const totalPages = Math.ceil(lista.length / this.itemsPerPage);
        const start = (this.currentPage-1)*this.itemsPerPage;
        const paginados = lista.slice(start, start+this.itemsPerPage);
        const container = document.getElementById('contentGridContainer');
        container.style.display = 'grid';
        if (!paginados.length) { container.innerHTML = '<div class="empty-state">No hay empresas</div>'; this.renderPagination(0); return; }
        container.innerHTML = paginados.map(emp => `
            <div class="card" onclick="CRM.abrirFichaEmpresa(${emp.id})">
                <div><strong>${this.escapeHtml(emp.nombre)}</strong> <span class="badge ${emp.estado==='activo'?'badge-completada':'badge-pendiente'}">${emp.estado}</span></div>
                <div>${emp.tipo} | ${emp.telefono || '—'}</div>
            </div>
        `).join('');
        this.renderPagination(totalPages);
    }

    renderizarContactos() {
        let lista = this.getFiltroActivo([...this.contactos]);
        lista.sort((a,b)=>a.nombre.localeCompare(b.nombre));
        const totalPages = Math.ceil(lista.length / this.itemsPerPage);
        const start = (this.currentPage-1)*this.itemsPerPage;
        const paginados = lista.slice(start, start+this.itemsPerPage);
        const container = document.getElementById('contentGridContainer');
        container.style.display = 'grid';
        if (!paginados.length) { container.innerHTML = '<div class="empty-state">No hay contactos</div>'; return; }
        container.innerHTML = paginados.map(cont => {
            const empresa = this.empresas.find(e=>e.id===cont.empresaId);
            return `<div class="card" onclick="CRM.abrirFichaContacto(${cont.id})">
                <div><strong>${this.escapeHtml(cont.nombre)}</strong></div>
                <div>${empresa ? this.escapeHtml(empresa.nombre) : 'Sin empresa'} | ${cont.cargo || '—'}</div>
            </div>`;
        }).join('');
        this.renderPagination(totalPages);
    }

    renderizarInteracciones() {
        let lista = [...this.interacciones];
        if (this.filtrosInteracciones.tipo !== 'todos') lista = lista.filter(i=>i.tipo === this.filtrosInteracciones.tipo);
        if (this.filtrosInteracciones.estado !== 'todos') lista = lista.filter(i=>i.estado === this.filtrosInteracciones.estado);
        if (this.filtrosInteracciones.contactoId !== 'todos') lista = lista.filter(i=>i.contactoId == this.filtrosInteracciones.contactoId);
        if (this.filtrosInteracciones.busqueda) {
            const q = this.filtrosInteracciones.busqueda.toLowerCase();
            lista = lista.filter(i=>i.asunto.toLowerCase().includes(q) || (i.descripcion||'').toLowerCase().includes(q));
        }
        if (this.filtrosInteracciones.fechaDesde) lista = lista.filter(i=>new Date(i.fecha) >= new Date(this.filtrosInteracciones.fechaDesde));
        if (this.filtrosInteracciones.fechaHasta) lista = lista.filter(i=>new Date(i.fecha) <= new Date(this.filtrosInteracciones.fechaHasta));
        lista.sort((a,b)=>new Date(b.fecha) - new Date(a.fecha));
        const totalPages = Math.ceil(lista.length / this.itemsPerPage);
        const start = (this.currentPage-1)*this.itemsPerPage;
        const paginados = lista.slice(start, start+this.itemsPerPage);
        const container = document.getElementById('contentGridContainer');
        container.style.display = 'grid';
        if (!paginados.length) { container.innerHTML = '<div class="empty-state">No hay interacciones</div>'; return; }
        container.innerHTML = paginados.map(inter => {
            const contacto = this.contactos.find(c=>c.id===inter.contactoId);
            return `<div class="card" onclick="CRM.abrirFichaInteraccion(${inter.id})">
                <div><strong>${this.escapeHtml(inter.asunto)}</strong> <span class="badge ${inter.estado==='pendiente'?'badge-pendiente':'badge-completada'}">${inter.estado}</span></div>
                <div>${inter.tipo} | ${contacto ? this.escapeHtml(contacto.nombre) : '—'} | ${new Date(inter.fecha).toLocaleDateString()}</div>
            </div>`;
        }).join('');
        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const container = document.getElementById('pagination');
        if (totalPages <= 1) { container.innerHTML = ''; return; }
        let html = `<button ${this.currentPage===1?'disabled':''} onclick="CRM.cambiarPagina(${this.currentPage-1})">Anterior</button>`;
        for (let i=1; i<=totalPages; i++) {
            html += `<button ${this.currentPage===i?'class="active"':''} onclick="CRM.cambiarPagina(${i})">${i}</button>`;
        }
        html += `<button ${this.currentPage===totalPages?'disabled':''} onclick="CRM.cambiarPagina(${this.currentPage+1})">Siguiente</button>`;
        container.innerHTML = html;
    }

    cambiarPagina(pagina) {
        this.currentPage = pagina;
        this.renderizarSegunPestana();
    }

    async renderizarDashboard() {
        document.getElementById('dashboardContainer').style.display = 'block';
        document.getElementById('contentGridContainer').style.display = 'none';
        const totalEmpresas = this.empresas.length;
        const totalContactos = this.contactos.length;
        const totalInteracciones = this.interacciones.length;
        const pendientes = this.interacciones.filter(i=>i.estado==='pendiente').length;
        document.getElementById('dashboardContainer').innerHTML = `
            <div class="dashboard-cards">
                <div class="card-stats"><h3>Empresas</h3><span>${totalEmpresas}</span></div>
                <div class="card-stats"><h3>Contactos</h3><span>${totalContactos}</span></div>
                <div class="card-stats"><h3>Interacciones</h3><span>${totalInteracciones}</span></div>
                <div class="card-stats"><h3>Pendientes</h3><span>${pendientes}</span></div>
            </div>
            <div class="charts-row"><canvas id="tipoChart"></canvas><canvas id="estadoChart"></canvas></div>
            <div class="recordatorios-panel" id="recordatoriosPanel"></div>
        `;
        // Gráficos
        const tipos = ['reunion','llamada','email','feria'];
        const countsTipos = tipos.map(t => this.interacciones.filter(i=>i.tipo===t).length);
        const ctx1 = document.getElementById('tipoChart').getContext('2d');
        new Chart(ctx1, { type: 'bar', data: { labels: tipos, datasets: [{ label: 'Cantidad', data: countsTipos, backgroundColor: '#667eea' }] } });
        const ctx2 = document.getElementById('estadoChart').getContext('2d');
        new Chart(ctx2, { type: 'pie', data: { labels: ['Completadas','Pendientes'], datasets: [{ data: [this.interacciones.filter(i=>i.estado==='completada').length, pendientes], backgroundColor: ['#4CAF50','#ff9800'] }] } });
        // Recordatorios
        const hoy = new Date();
        const proximas = this.interacciones.filter(i => i.estado==='pendiente' && new Date(i.fecha) >= hoy && new Date(i.fecha) <= new Date(hoy.getTime()+2*86400000));
        const panel = document.getElementById('recordatoriosPanel');
        if (proximas.length===0) panel.innerHTML = '<p>✅ No hay tareas pendientes próximas.</p>';
        else panel.innerHTML = `<h3>⏰ Tareas pendientes próximas (próximos 2 días)</h3><ul>${proximas.map(i=>`<li>${this.escapeHtml(i.asunto)} - ${new Date(i.fecha).toLocaleString()}</li>`).join('')}</ul>`;
    }

    cambiarPestana(pestana) {
        this.currentPestana = pestana;
        document.querySelectorAll('.nav-tab').forEach(tab=>tab.classList.remove('active'));
        event.target.classList.add('active');
        this.currentPage = 1;
        if (pestana === 'interacciones') {
            document.getElementById('filtrosInteracciones').style.display = 'flex';
            this.cargarFiltrosInteracciones();
        } else {
            document.getElementById('filtrosInteracciones').style.display = 'none';
        }
        document.getElementById('btnAgregar').innerHTML = pestana === 'empresas' ? '+ Nueva Empresa' : (pestana === 'contactos' ? '+ Nuevo Contacto' : '+ Nueva Interacción');
        this.renderizarSegunPestana();
    }

    cargarFiltrosInteracciones() {
        const div = document.getElementById('filtrosInteracciones');
        div.innerHTML = `
            <select id="filtroTipo"><option value="todos">Todos tipos</option><option value="reunion">Reunión</option><option value="llamada">Llamada</option><option value="email">Email</option><option value="feria">Feria</option></select>
            <select id="filtroEstado"><option value="todos">Todos estados</option><option value="pendiente">Pendiente</option><option value="completada">Completada</option></select>
            <select id="filtroContacto"><option value="todos">Todos contactos</option>${this.contactos.map(c=>`<option value="${c.id}">${this.escapeHtml(c.nombre)}</option>`).join('')}</select>
            <input type="text" id="filtroBusqueda" placeholder="Buscar...">
            <input type="date" id="filtroFechaDesde" placeholder="Desde">
            <input type="date" id="filtroFechaHasta" placeholder="Hasta">
            <button class="btn-secondary" onclick="CRM.aplicarFiltrosInteracciones()">Filtrar</button>
            <button class="btn-outline" onclick="CRM.limpiarFiltrosInteracciones()">Limpiar</button>
        `;
        // Cargar valores actuales
        document.getElementById('filtroTipo').value = this.filtrosInteracciones.tipo;
        document.getElementById('filtroEstado').value = this.filtrosInteracciones.estado;
        document.getElementById('filtroContacto').value = this.filtrosInteracciones.contactoId;
        document.getElementById('filtroBusqueda').value = this.filtrosInteracciones.busqueda;
        document.getElementById('filtroFechaDesde').value = this.filtrosInteracciones.fechaDesde;
        document.getElementById('filtroFechaHasta').value = this.filtrosInteracciones.fechaHasta;
    }

    aplicarFiltrosInteracciones() {
        this.filtrosInteracciones.tipo = document.getElementById('filtroTipo').value;
        this.filtrosInteracciones.estado = document.getElementById('filtroEstado').value;
        this.filtrosInteracciones.contactoId = document.getElementById('filtroContacto').value;
        this.filtrosInteracciones.busqueda = document.getElementById('filtroBusqueda').value;
        this.filtrosInteracciones.fechaDesde = document.getElementById('filtroFechaDesde').value;
        this.filtrosInteracciones.fechaHasta = document.getElementById('filtroFechaHasta').value;
        this.currentPage = 1;
        this.renderizarInteracciones();
    }

    limpiarFiltrosInteracciones() {
        this.filtrosInteracciones = { tipo: 'todos', estado: 'todos', contactoId: 'todos', busqueda: '', fechaDesde: '', fechaHasta: '' };
        this.cargarFiltrosInteracciones();
        this.renderizarInteracciones();
    }

    aplicarFiltroRapido() {
        this.filtroActivos = document.getElementById('filtroRapido').value;
        this.currentPage = 1;
        this.renderizarSegunPestana();
    }

    cambiarOrden() {
        this.currentSort = document.getElementById('sortBy').value;
        this.renderizarSegunPestana();
    }

    accionAgregar() {
        if (this.currentPestana === 'empresas') this.mostrarModalCrearEmpresa();
        else if (this.currentPestana === 'contactos') this.mostrarModalCrearContacto();
        else this.mostrarModalNuevaInteraccion();
    }

    mostrarModalCrearEmpresa() {
        Swal.fire({
            title: 'Nueva Empresa',
            html: `<input id="nombre" class="swal2-input" placeholder="Nombre*"><input id="tipo" class="swal2-select" placeholder="Tipo"><select id="tipoSelect"><option value="fabricante">Fabricante</option><option value="distribuidor">Distribuidor</option><option value="proveedor">Proveedor</option></select><input id="telefono" placeholder="Teléfono">`,
            preConfirm: async () => {
                const nombre = document.getElementById('nombre').value;
                if (!nombre) Swal.showValidationMessage('Nombre requerido');
                const nueva = { nombre, tipo: document.getElementById('tipoSelect').value, estado: 'activo', nit: '', direccion: '', telefono: document.getElementById('telefono').value, email: '', web: '', notas: '', tags: [], fecha_creacion: new Date().toISOString() };
                await this.guardar('empresas', nueva);
                await this.cargarDatos();
                Swal.fire('Creada', 'Empresa añadida', 'success');
            }
        });
    }

    mostrarModalCrearContacto() { /* similar */ Swal.fire('En construcción'); }
    mostrarModalNuevaInteraccion() { Swal.fire('En construcción'); }

    async abrirFichaEmpresa(id) {
        const empresa = this.empresas.find(e=>e.id===id);
        if (!empresa) return;
        const contactosEmpresa = this.contactos.filter(c=>c.empresaId===id);
        Swal.fire({
            title: empresa.nombre,
            html: `<div><strong>Teléfono:</strong> ${empresa.telefono || '—'}<br><strong>Email:</strong> ${empresa.email || '—'}<br><strong>Contactos:</strong> ${contactosEmpresa.map(c=>c.nombre).join(', ') || 'Ninguno'}</div>`,
            icon: 'info'
        });
    }

    abrirFichaContacto(id) { Swal.fire('Ficha contacto en desarrollo'); }
    abrirFichaInteraccion(id) { Swal.fire('Ficha interacción en desarrollo'); }

    busquedaGlobal() {
        const term = document.getElementById('globalSearchInput').value.toLowerCase().trim();
        if (term.length < 2) return Swal.fire('Mínimo 2 caracteres');
        const results = [];
        this.empresas.forEach(e => { if(e.nombre.toLowerCase().includes(term)) results.push(`🏭 Empresa: ${e.nombre}`); });
        this.contactos.forEach(c => { if(c.nombre.toLowerCase().includes(term)) results.push(`👤 Contacto: ${c.nombre}`); });
        this.interacciones.forEach(i => { if(i.asunto.toLowerCase().includes(term)) results.push(`💬 Interacción: ${i.asunto}`); });
        Swal.fire('Resultados', results.join('<br>') || 'No se encontraron resultados');
    }

    async importarExcelCompleto() {
        Swal.fire('Función de importación disponible en la versión completa. Por ahora, use la plantilla.');
    }

    descargarPlantilla() {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([['nombre','tipo','estado','nit','direccion','telefono','email','web','tags']]);
        XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
        XLSX.writeFile(wb, 'plantilla_crm.xlsx');
    }

    exportarExcel() {
        const ws = XLSX.utils.json_to_sheet(this.empresas.map(e=>({ Nombre: e.nombre, Tipo: e.tipo, Estado: e.estado, Teléfono: e.telefono })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
        XLSX.writeFile(wb, `crm_${new Date().toISOString().slice(0,10)}.xlsx`);
    }

    exportarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Listado de empresas', 14, 10);
        const data = this.empresas.map(e=>[e.nombre, e.tipo, e.estado]);
        doc.autoTable({ head: [['Nombre','Tipo','Estado']], body: data, startY: 20 });
        doc.save(`empresas_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    verCalendario() {
        const modal = document.getElementById('modalCalendario');
        modal.style.display = 'flex';
        const calendarEl = document.getElementById('calendar');
        if (window.calendarInstance) window.calendarInstance.destroy();
        const events = this.interacciones.map(i => ({
            title: i.asunto,
            start: i.fecha,
            color: i.estado === 'pendiente' ? '#ff9800' : '#4CAF50',
            extendedProps: { id: i.id }
        }));
        window.calendarInstance = new FullCalendar.Calendar(calendarEl, { initialView: 'dayGridMonth', events });
        window.calendarInstance.render();
    }

    cerrarModalCalendario() { document.getElementById('modalCalendario').style.display = 'none'; }
    cerrarModalConfirmacion() { document.getElementById('modalConfirmacion').style.display = 'none'; this.modalConfirmacionCallback = null; }
    confirmarAccion(mensaje, callback) {
        document.getElementById('confirmacionMensaje').innerText = mensaje;
        this.modalConfirmacionCallback = callback;
        document.getElementById('modalConfirmacion').style.display = 'flex';
        document.getElementById('confirmarAccionBtn').onclick = () => { if(this.modalConfirmacionCallback) this.modalConfirmacionCallback(); this.cerrarModalConfirmacion(); };
    }

    escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){ if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

    actualizarContador() {
        document.getElementById('stats').innerHTML = `📊 ${this.empresas.length} empresas | 👥 ${this.contactos.length} contactos | 💬 ${this.interacciones.length} interacciones`;
    }

    setupEventListeners() {
        // Cerrar modales al hacer clic fuera
        window.onclick = (e) => { if(e.target.classList && e.target.classList.contains('modal')) e.target.style.display = 'none'; };
    }
}