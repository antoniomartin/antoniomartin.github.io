import { supabase } from './db.js'

export async function getContactos() {
  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .order('nombre')

  if (error) {
    console.error(error)
    return []
  }

  return data
}