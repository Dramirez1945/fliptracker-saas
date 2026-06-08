import { createContext, useContext } from 'react'
import { useTier } from '../hooks/useTier'

const TierContext = createContext(null)

export function TierProvider({ children }) {
  const tierData = useTier()
  return (
    <TierContext.Provider value={tierData}>
      {children}
    </TierContext.Provider>
  )
}

export function useTierContext() {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useTierContext must be used within TierProvider')
  return ctx
}
