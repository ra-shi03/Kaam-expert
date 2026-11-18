import { createSlice } from '@reduxjs/toolkit'

export const AUTH_STORAGE_KEY = 'lc_access_token'

function readStoredToken() {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_STORAGE_KEY)
}

const USER_CACHE_KEY = 'lc_cached_user'

function readCachedUser() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage.getItem(AUTH_STORAGE_KEY)) return null
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedUser(user) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    // ignore storage errors
  }
}

const cachedUser = readCachedUser()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: readStoredToken(),
    user: cachedUser,
    loading: Boolean(readStoredToken()) && !cachedUser,
  },
  reducers: {
    setCredentials(state, action) {
      const { accessToken, user } = action.payload
      if (accessToken) localStorage.setItem(AUTH_STORAGE_KEY, accessToken)
      else localStorage.removeItem(AUTH_STORAGE_KEY)
      state.token = accessToken ?? null
      state.user = user ?? null
      writeCachedUser(state.user)
    },
    setUser(state, action) {
      state.user = action.payload
      writeCachedUser(action.payload)
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    clearSession(state) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      writeCachedUser(null)
      state.token = null
      state.user = null
      state.loading = false
    },
  },
})

export const { setCredentials, setUser, setLoading, clearSession } = authSlice.actions
export const authReducer = authSlice.reducer
