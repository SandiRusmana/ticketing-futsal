import { useContext } from 'react'
import { NavigationContext } from './navigationContextInstance.js'

/**
 * useNavigation
 * Custom Hook untuk mengakses state navigasi dummy
 */
export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation harus digunakan di dalam NavigationProvider')
  }
  return context
}
