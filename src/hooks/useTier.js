import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export const TIER_LIMITS = {
  free: {
    items: 3,
    supplies: 5,
    aiGenerations: 3,
    aiRegens: 0,
    export: false,
  },
  flipper: {
    items: Infinity,
    supplies: Infinity,
    aiGenerations: 25,
    aiRegens: 1,
    export: false,
  },
  pro: {
    items: Infinity,
    supplies: Infinity,
    aiGenerations: Infinity,
    aiRegens: 5,
    export: true,
  },
}

export function useTier() {
  const [userRecord, setUserRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUserRecord = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUserRecord(null); return }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserRecord(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserRecord()
  }, [fetchUserRecord])

  const tier = userRecord?.tier ?? 'free'
  const limits = TIER_LIMITS[tier]

  const shouldResetAiGens = () => {
    if (tier !== 'flipper') return false
    if (!userRecord?.ai_generations_reset_at) return true
    const resetAt = new Date(userRecord.ai_generations_reset_at)
    const now = new Date()
    const daysSinceReset = (now - resetAt) / (1000 * 60 * 60 * 24)
    return daysSinceReset >= 30
  }

  const aiGensUsed = shouldResetAiGens() ? 0 : (userRecord?.ai_generations_used ?? 0)
  const itemsCreated = userRecord?.items_created_count ?? 0
  const suppliesCreated = userRecord?.supplies_created_count ?? 0

  const aiGensRemaining = limits.aiGenerations === Infinity
    ? Infinity
    : Math.max(0, limits.aiGenerations - aiGensUsed)

  const itemsRemaining = limits.items === Infinity
    ? Infinity
    : Math.max(0, limits.items - itemsCreated)

  const suppliesRemaining = limits.supplies === Infinity
    ? Infinity
    : Math.max(0, limits.supplies - suppliesCreated)

  const atItemLimit = itemsRemaining === 0
  const atSupplyLimit = suppliesRemaining === 0
  const atAiLimit = aiGensRemaining === 0

  const nearItemLimit = limits.items !== Infinity &&
    itemsCreated / limits.items >= 0.8 && !atItemLimit
  const nearSupplyLimit = limits.supplies !== Infinity &&
    suppliesCreated / limits.supplies >= 0.8 && !atSupplyLimit
  const nearAiLimit = limits.aiGenerations !== Infinity &&
    aiGensUsed / limits.aiGenerations >= 0.8 && !atAiLimit

  return {
    userRecord,
    loading,
    error,
    refetch: fetchUserRecord,
    tier,
    limits,
    isFree: tier === 'free',
    isFlipper: tier === 'flipper',
    isPro: tier === 'pro',
    aiGensUsed,
    aiGensRemaining,
    itemsCreated,
    itemsRemaining,
    suppliesCreated,
    suppliesRemaining,
    atItemLimit,
    atSupplyLimit,
    atAiLimit,
    nearItemLimit,
    nearSupplyLimit,
    nearAiLimit,
    canExport: limits.export,
    canRegen: limits.aiRegens > 0,
    regenLimit: limits.aiRegens,
  }
}
