import { renderEmpresas } from './empresas.js'
import { openEmpresaModal } from './ui.js'

async function init() {
  await renderEmpresas()

  document
    .getElementById('newEmpresaBtn')
    .addEventListener('click', () => {
      openEmpresaModal()
    })
}

init()