import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { pb } from '../backend/pb.js'
import { login as loginService, logout as logoutService, getCurrentUser } from '../backend/userService.js'

export const useAuthStore = defineStore('auth', () => {
  // Estado reactivo
  const user = ref(null)
  const isLoggedIn = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Computeds
  const userEmail = computed(() => user.value?.email ?? '')
  const userName = computed(() => user.value?.nombre ?? '')
  const userRole = computed(() => user.value?.rol ?? 'usuario')
  // isAdmin -> true only for users explicitly in the 'admin' role.
  // Previously a different elevated role was treated as admin; that special-case
  // behavior is no longer applied.
  const isAdmin = computed(() => userRole.value === 'admin')

  // Acciones
  function initAuth() {
    // Inicializar desde PocketBase authStore
    if (pb?.authStore?.isValid) {
      isLoggedIn.value = true
      user.value = pb.authStore.model
    } else {
      isLoggedIn.value = false
      user.value = null
    }

    // Suscribirse a cambios en el authStore
    if (pb?.authStore?.onChange) {
      pb.authStore.onChange((token, model) => {
        isLoggedIn.value = !!model
        user.value = model
      })
    }
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const authData = await loginService(email, password)
      user.value = authData.record
      isLoggedIn.value = true
      return authData
    } catch (err) {
      error.value = err.message || String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null
    try {
      await logoutService()
      user.value = null
      isLoggedIn.value = false
    } catch (err) {
      error.value = err.message || String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // Estado
    user,
    isLoggedIn,
    loading,
    error,
    // Computeds
    userEmail,
    userName,
    userRole,
    isAdmin,
    // Acciones
    initAuth,
    login,
    logout,
    clearError,
  }
})