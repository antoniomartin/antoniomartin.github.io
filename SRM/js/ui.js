import {
          ${empresa ? 'Editar Empresa' : 'Nueva Empresa'}
        </h2>

        <form id="empresaForm">

          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value="${empresa?.nombre || ''}"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value="${empresa?.email || ''}"
          />

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value="${empresa?.telefono || ''}"
          />

          <textarea
            name="notas"
            placeholder="Notas"
          >${empresa?.notas || ''}</textarea>

          <button class="primary-btn">
            Guardar
          </button>

        </form>

      </div>
    </div>
  `

  container
    .querySelector('.modal-overlay')
    .addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeModal()
      }
    })

  document
    .getElementById('empresaForm')
    .addEventListener('submit', async (e) => {
      e.preventDefault()

      const formData = new FormData(e.target)

      const payload = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        notas: formData.get('notas'),
      }

      await createEmpresa(payload)

      closeModal()
      await renderEmpresas()
    })
}