/* Ambient module declarations to make the store types available when importing via @/stores/... */
import type { Ref, ComputedRef } from 'vue'

export interface AuthUser {
  id?: string
  email?: string
  nombre?: string
  rol?: string
  [key: string]: any
}

export interface AuthStore {
  user: Ref<AuthUser | null>
  isLoggedIn: Ref<boolean>
  loading: Ref<boolean>
  error: Ref<any>
  userEmail: ComputedRef<string>
  userName: ComputedRef<string>
  userRole: ComputedRef<string>
  isAdmin: ComputedRef<boolean>
  initAuth: () => void
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  clearError: () => void
}

declare module '@/stores/authStore' {
  export function useAuthStore(): AuthStore
  export default useAuthStore
}

// support imports that include the .js extension or different casing
declare module '@/stores/authStore.js' {
  export function useAuthStore(): AuthStore
  export default useAuthStore
}

declare module '@/stores/AuthStore.js' {
  export function useAuthStore(): AuthStore
  export default useAuthStore
}

// relative imports from components using ../stores/authStore or ../stores/authStore.js
declare module '../stores/authStore' {
  export function useAuthStore(): AuthStore
  export default useAuthStore
}

declare module '../stores/authStore.js' {
  export function useAuthStore(): AuthStore
  export default useAuthStore
}

declare module '../stores/AuthStore.js' {
  export function useAuthStore(): AuthStore
  export default useAuthStore
}
