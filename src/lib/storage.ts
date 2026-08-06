import type { MigrationConfig } from './scriptGenerator'

const STORAGE_KEY = 'o365-migration-script-generator-state'

export interface ProfileRecord {
  name: string
  config: MigrationConfig
  script: string
  updatedAt: string
}

export interface AppState {
  activeProfileName: string
  profiles: Record<string, ProfileRecord>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function getDefaultState(): AppState {
  return {
    activeProfileName: '',
    profiles: {}
  }
}

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return getDefaultState()
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isObject(parsed)) {
      return getDefaultState()
    }

    const activeProfileName = typeof parsed.activeProfileName === 'string' ? parsed.activeProfileName : ''
    const profiles = isObject(parsed.profiles) ? (parsed.profiles as Record<string, ProfileRecord>) : {}

    return {
      activeProfileName,
      profiles
    }
  } catch {
    return getDefaultState()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function upsertProfile(
  state: AppState,
  profileName: string,
  config: MigrationConfig,
  script: string
): AppState {
  const nextState = {
    ...state,
    activeProfileName: profileName,
    profiles: {
      ...state.profiles,
      [profileName]: {
        name: profileName,
        config,
        script,
        updatedAt: new Date().toISOString()
      }
    }
  }

  return nextState
}

export function deleteProfile(state: AppState, profileName: string): AppState {
  const nextProfiles = { ...state.profiles }
  delete nextProfiles[profileName]

  return {
    activeProfileName: state.activeProfileName === profileName ? '' : state.activeProfileName,
    profiles: nextProfiles
  }
}

export function getProfileNames(state: AppState) {
  return Object.keys(state.profiles).sort((a, b) => a.localeCompare(b))
}