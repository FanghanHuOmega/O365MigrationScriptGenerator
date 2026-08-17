import type { MigrationConfig } from './scriptGenerator'

const STORAGE_KEY = 'o365-migration-script-generator-state'
const DB_NAME = 'o365-migration-script-generator-db'
const DB_VERSION = 1
const SCRIPT_STORE_NAME = 'profileScripts'

export interface ProfileRecord {
  name: string
  config: MigrationConfig
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

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(SCRIPT_STORE_NAME)) {
        database.createObjectStore(SCRIPT_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB database.'))
    }
  })
}

function runStoreRequest<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SCRIPT_STORE_NAME, mode)
    const store = transaction.objectStore(SCRIPT_STORE_NAME)
    const request = operation(store)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'))
    }
  })
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
    const rawProfiles = isObject(parsed.profiles) ? parsed.profiles : {}
    const profiles = Object.fromEntries(
			Object.entries(rawProfiles).flatMap(([profileName, profileValue]) => {
				if (!isObject(profileValue)) {
					return []
				}

				return [[
					profileName,
					{
						name: typeof profileValue.name === 'string' ? profileValue.name : profileName,
						config: profileValue.config as MigrationConfig,
						updatedAt: typeof profileValue.updatedAt === 'string' ? profileValue.updatedAt : new Date().toISOString()
					}
				]]
			})
		) as Record<string, ProfileRecord>

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
  config: MigrationConfig
): AppState {
  const nextState = {
		...state,
		activeProfileName: profileName,
		profiles: {
			...state.profiles,
			[profileName]: {
				name: profileName,
				config,
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

export async function loadProfileScript(profileName: string): Promise<string | null> {
  const database = await openDatabase()

  try {
    const result = await runStoreRequest<unknown>(database, 'readonly', (store) => store.get(profileName))
    return typeof result === 'string' ? result : null
  } finally {
    database.close()
  }
}

export async function saveProfileScript(profileName: string, script: string): Promise<void> {
  const database = await openDatabase()

  try {
    await runStoreRequest(database, 'readwrite', (store) => store.put(script, profileName))
  } finally {
    database.close()
  }
}

export async function deleteProfileScript(profileName: string): Promise<void> {
  const database = await openDatabase()

  try {
    await runStoreRequest(database, 'readwrite', (store) => store.delete(profileName))
  } finally {
    database.close()
  }
}

export async function migrateLegacyScripts(): Promise<AppState> {
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
    const rawProfiles = isObject(parsed.profiles) ? parsed.profiles : {}
    const nextProfiles: Record<string, ProfileRecord> = {}
    const legacyScripts: Array<Promise<void>> = []

    for (const [profileName, profileValue] of Object.entries(rawProfiles)) {
      if (!isObject(profileValue)) {
        continue
      }

      const legacyProfile = profileValue as unknown as ProfileRecord & { script?: string }
      nextProfiles[profileName] = {
        name: typeof legacyProfile.name === 'string' ? legacyProfile.name : profileName,
        config: legacyProfile.config,
        updatedAt: typeof legacyProfile.updatedAt === 'string' ? legacyProfile.updatedAt : new Date().toISOString()
      }

      if (typeof legacyProfile.script === 'string') {
        legacyScripts.push(saveProfileScript(profileName, legacyProfile.script))
      }
    }

    if (legacyScripts.length > 0) {
      await Promise.all(legacyScripts)
    }

    const nextState: AppState = {
      activeProfileName,
      profiles: nextProfiles
    }

    saveState(nextState)
    return nextState
  } catch {
    return getDefaultState()
  }
}