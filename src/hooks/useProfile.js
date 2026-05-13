import { useState } from 'react'

const ACTIVE_KEY = 'aguilang_active_profile'

const DEFAULT_PROFILE = {
  name: 'Aguila', type: 'adult', initial: 'A',
  points: 0, level: 1, streak: 0,
}

export function useProfile() {
  const [profile, setProfileState] = useState(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  const save = (updates) => {
    const updated = { ...profile, ...updates }
    setProfileState(updated)
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(updated))
  }

  const updateName = (name) => {
    const trimmed = name.trim() || 'Aguila'
    save({ name: trimmed, initial: trimmed[0].toUpperCase() })
  }

  const updateType = (type) => save({ type })

  const setActiveProfile = (p) => {
    setProfileState(p)
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(p))
  }

  const clearActiveProfile = () => {
    setProfileState(DEFAULT_PROFILE)
    localStorage.removeItem(ACTIVE_KEY)
  }

  return { profile, updateName, updateType, setActiveProfile, clearActiveProfile }
}
