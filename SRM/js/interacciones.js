import { supabase } from './db.js'

export async function getInteracciones() {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .order('fecha', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return data
}