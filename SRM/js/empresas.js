import { supabase } from './db.js'
}

export async function createEmpresa(payload) {
  const { error } = await supabase
    .from('empresas')
    .insert(payload)

  if (error) {
    console.error(error)
  }
}

export async function deleteEmpresa(id) {
  const confirmed = confirm('¿Eliminar empresa?')

  if (!confirmed) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
  }
}

export async function renderEmpresas() {
  const empresas = await getEmpresas()

  const container = document.getElementById('content')

  container.innerHTML = empresas
    .map((empresa) => `
      <div class="card">
        <h3>${escapeHtml(empresa.nombre)}</h3>

        <p>${escapeHtml(empresa.email || '')}</p>
        <p>${escapeHtml(empresa.telefono || '')}</p>

        <div class="card-actions">
          <button
            class="primary-btn edit-btn"
            data-id="${empresa.id}"
          >
            Editar
          </button>

          <button
            class="danger-btn delete-btn"
            data-id="${empresa.id}"
          >
            Eliminar
          </button>
        </div>
      </div>
    `)
    .join('')

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id

      await deleteEmpresa(id)
      await renderEmpresas()
    })
  })

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const empresa = empresas.find(
        (x) => x.id === e.target.dataset.id
      )

      openEmpresaModal(empresa)
    })
  })
}