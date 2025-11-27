import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getListaCaballos, getCaballoByText, deleteCaballo } from '../backend/caballoService.js'
import { getImagenesPorCaballo } from '../backend/imagenService.js'

export const useCaballosStore = defineStore('caballos', () => {
  // Estado reactivo
  const caballos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const expandedCaballoId = ref(null)
  const caballoImages = ref({}) // { [caballoId]: [images...] }
  const searchTerm = ref('')
  const pageSize = 9
  const currentPage = ref(1)
  const pageDirection = ref('next') // 'next' | 'prev'

  // Computeds
  const totalPages = computed(() => Math.max(1, Math.ceil(caballos.value.length / pageSize)))
  
  const visibleCaballos = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return caballos.value.slice(start, start + pageSize)
  })

  const pageTransition = computed(() => (pageDirection.value === 'next' ? 'page-next' : 'page-prev'))

  const contentKey = computed(() => {
    if (loading.value) return 'loading'
    if (error.value) return 'error'
    if (caballos.value.length === 0) return 'empty'
    return `page-${currentPage.value}`
  })

  // Detects error messages implying admin-only / permission problems.
  // Avoid the deprecated/speculative elevated-role phrasing.
  const isAdminRequiredErr = computed(() => {
    if (!error.value) return false
    const text = String(error.value).toLowerCase()
    return (
      text.includes('admin') ||
      text.includes('administrador') ||
      text.includes('permiso') ||
      text.includes('permission') ||
      text.includes('only admin') ||
      text.includes('solo admin')
    )
  })

  // Acciones
  async function loadCaballos() {
    loading.value = true
    error.value = null
    try {
      const lista = await getListaCaballos()
      caballos.value = lista.slice().reverse()
      
      // Precargar imágenes para cada caballo
      for (const caballo of caballos.value) {
        try {
          const images = await getImagenesPorCaballo(caballo.id)
          caballoImages.value[caballo.id] = images
        } catch (err) {
          console.warn(`No se pudieron cargar imágenes para caballo ${caballo.id}:`, err)
          caballoImages.value[caballo.id] = []
        }
      }
    } catch (err) {
      error.value = err.message || String(err)
    } finally {
      loading.value = false
    }
  }

  async function performSearch() {
    loading.value = true
    error.value = null
    try {
      if (searchTerm.value && searchTerm.value.trim().length > 0) {
        const lista = await getCaballoByText(searchTerm.value.trim())
        caballos.value = lista.slice().reverse()
      } else {
        const lista = await getListaCaballos()
        caballos.value = lista.slice().reverse()
      }

      currentPage.value = 1
      // precargar imágenes para los resultados
      for (const caballo of caballos.value) {
        try {
          const images = await getImagenesPorCaballo(caballo.id)
          caballoImages.value[caballo.id] = images
        } catch (err) {
          caballoImages.value[caballo.id] = []
        }
      }
    } catch (err) {
      error.value = err.message || String(err)
    } finally {
      loading.value = false
    }
  }

  function toggleDetalles(caballoId) {
    expandedCaballoId.value = expandedCaballoId.value === caballoId ? null : caballoId
  }

  async function removeCaballo(id) {
    const ok = window.confirm('¿Eliminar este caballo? Esta acción no se puede deshacer.')
    if (!ok) return
    loading.value = true
    try {
      await deleteCaballo(id)
      caballos.value = caballos.value.filter(c => c.id !== id)
      delete caballoImages.value[id]
      if (expandedCaballoId.value === id) expandedCaballoId.value = null
      // si la página actual queda vacía tras borrar, retroceder una página si es posible
      if (visibleCaballos.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error('Error eliminando caballo:', err)
      error.value = err.message || String(err)
    } finally {
      loading.value = false
    }
  }

  function goPrev() {
    if (currentPage.value > 1) currentPage.value--
  }

  function goNext() {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  function goPrevDirectional() {
    if (currentPage.value <= 1) return
    pageDirection.value = 'prev'
    currentPage.value--
  }

  function goNextDirectional() {
    if (currentPage.value >= totalPages.value) return
    pageDirection.value = 'next'
    currentPage.value++
  }

  function setSearchTerm(term) {
    searchTerm.value = term
  }

  // Retornar estado y acciones
  return {
    caballos,
    loading,
    error,
    expandedCaballoId,
    caballoImages,
    searchTerm,
    pageSize,
    currentPage,
    pageDirection,
    totalPages,
    visibleCaballos,
    pageTransition,
    contentKey,
    isAdminRequiredErr,
    loadCaballos,
    performSearch,
    toggleDetalles,
    removeCaballo,
    goPrev,
    goNext,
    goPrevDirectional,
    goNextDirectional,
    setSearchTerm,
  }
})
