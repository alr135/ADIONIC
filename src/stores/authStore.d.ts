// Same declarations for the capitalized JS filename variant (AuthStore.js)
import type { Ref, ComputedRef } from 'vue'

export interface AuthUser {
  id?: string
  email?: string
  nombre?: string
  rol?: string
  [key: string]: any
}

export interface AuthStore {
  // state
  user: Ref<AuthUser | null>
  isLoggedIn: Ref<boolean>
  loading: Ref<boolean>
  error: Ref<any>

  // computed
  userEmail: ComputedRef<string>
  userName: ComputedRef<string>
  userRole: ComputedRef<string>
  isAdmin: ComputedRef<boolean>

  // actions
  initAuth: () => void
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  clearError: () => void
}

export function useAuthStore(): AuthStore

export default useAuthStore
// Type declarations for the JS Pinia auth store
import type { Ref, ComputedRef } from 'vue'

export interface AuthUser {
  id?: string
  email?: string
  nombre?: string
  rol?: string
  [key: string]: any
}

export interface AuthStore {
  // state
  user: Ref<AuthUser | null>
  isLoggedIn: Ref<boolean>
  loading: Ref<boolean>
  error: Ref<any>

  // computed
  userEmail: ComputedRef<string>
  userName: ComputedRef<string>
  userRole: ComputedRef<string>
  isAdmin: ComputedRef<boolean>

  // actions
  initAuth: () => void
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  clearError: () => void
}

export function useAuthStore(): AuthStore

export default useAuthStore

// Also add an ambient module declaration for the path alias used in imports
declare module '@/stores/authStore' {
  export * from './authStore'
}
