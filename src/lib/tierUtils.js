import { supabase } from '../supabaseClient'

export async function incrementItemCount(userId) {
  const { error } = await supabase.rpc('increment_items_count', { user_id: userId })
  if (error) console.error('Failed to increment item count:', error)
}

export async function incrementSupplyCount(userId) {
  const { error } = await supabase.rpc('increment_supplies_count', { user_id: userId })
  if (error) console.error('Failed to increment supply count:', error)
}

export async function incrementAiGenCount(userId) {
  const { error } = await supabase.rpc('increment_ai_gen_count', { user_id: userId })
  if (error) console.error('Failed to increment AI gen count:', error)
}

export async function resetAiGenCount(userId) {
  const { error } = await supabase
    .from('users')
    .update({
      ai_generations_used: 0,
      ai_generations_reset_at: new Date().toISOString()
    })
    .eq('id', userId)
  if (error) console.error('Failed to reset AI gen count:', error)
}
