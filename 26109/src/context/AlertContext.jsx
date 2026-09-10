import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { ALERTS } from '../data/mockData'

const AlertContext = createContext(null)

export function AlertProvider({ children }) {
  // In-memory state: page reload resets alert status back to default open list
  const [reviewedIds, setReviewedIds] = useState([])

  const markReviewed = useCallback((alertOrAnimalId) => {
    setReviewedIds((prev) => {
      const matchingAlerts = ALERTS.filter(
        (a) => a.id === alertOrAnimalId || a.animalId === alertOrAnimalId
      ).map((a) => a.id)
      
      return Array.from(new Set([...prev, alertOrAnimalId, ...matchingAlerts]))
    })
  }, [])

  const isReviewed = useCallback(
    (alertOrAnimalId) => {
      if (!alertOrAnimalId) return false
      return reviewedIds.some(
        (id) =>
          id === alertOrAnimalId ||
          ALERTS.some(
            (a) =>
              (a.id === alertOrAnimalId || a.animalId === alertOrAnimalId) &&
              (reviewedIds.includes(a.id) || reviewedIds.includes(a.animalId))
          )
      )
    },
    [reviewedIds]
  )

  const value = useMemo(
    () => ({ reviewedIds, markReviewed, isReviewed }),
    [reviewedIds, markReviewed, isReviewed]
  )

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
}

export function useAlerts() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider')
  return ctx
}
