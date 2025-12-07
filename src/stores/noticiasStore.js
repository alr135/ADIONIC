import { ref, computed, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import { getListaNoticias, getNoticiaByTitulo, deleteNoticia } from '../backend/noticiaService.js'
import { getImagenesPorNoticia } from '../backend/imagenService.js'
import { pb } from '../backend/pb.js'

export const useNoticiasStore = defineStore('noticias', () => {
  // Estado reactivo
  const noticias = ref([])
  const loading = ref(false)
  const error = ref(null)
  const expandedNoticiaId = ref(null)
  const noticiasImages = ref({}) // { [noticiaId]: [images...] }
  const searchTerm = ref('')
  const pageSize = 9
  const currentPage = ref(1)
  const pageDirection = ref('next') // 'next' | 'prev'
  const realtimeSubscription = ref(null) // Nueva: para guardar la suscripción

  // Computeds
  const totalPages = computed(() => Math.max(1, Math.ceil(noticias.value.length / pageSize)))
  
  const visibleNoticias = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return noticias.value.slice(start, start + pageSize)
  })

  const pageTransition = computed(() => (pageDirection.value === 'next' ? 'page-next' : 'page-prev'))

  const contentKey = computed(() => {
    if (loading.value) return 'loading'
    if (error.value) return 'error'
    if (noticias.value.length === 0) return 'empty'
    return `page-${currentPage.value}`
  })

  // Detects error messages implying admin-only / permission problems.
  // Renamed to avoid the former special-case naming that referenced an elevated role.
  const isAdminRequiredErr = computed(() => {
    if (!error.value) return false
    const text = String(error.value).toLowerCase()
    // be more generic: detect references to admin/administrator or permission-only messages
    return (
      text.includes('admin') ||
      text.includes('administrador') ||
      text.includes('permiso') ||
      text.includes('permission') ||
      text.includes('only admin') ||
      text.includes('solo admin') ||
      text.includes('only administrators')
    )
  })

  // Acciones
  async function loadNoticias() {
    loading.value = true
    error.value = null
    try {
      const lista = await getListaNoticias()
      noticias.value = lista.slice().reverse()
      
      // Precargar imágenes para cada noticia
      for (const noticia of noticias.value) {
        try {
          const images = await getImagenesPorNoticia(noticia.id)
          noticiasImages.value[noticia.id] = images
        } catch (err) {
          console.warn(`No se pudieron cargar imágenes para noticia ${noticia.id}:`, err)
          noticiasImages.value[noticia.id] = []
        }
      }
    } catch (err) {
      error.value = err.message || String(err)
    } finally {
      loading.value = false
    }
  }

  // Nueva acción: Suscribirse a cambios en tiempo real
  async function subscribeToRealtimeUpdates() {
    // Cancelar suscripción anterior si existe
    if (realtimeSubscription.value) {
      realtimeSubscription.value.unsubscribe()
    }

    try {
      // Suscribirse a la colección 'noticias'
      realtimeSubscription.value = pb.collection('noticias').subscribe('*', async (e) => {
        console.log('Evento en tiempo real (noticias):', e.action, e.record)
        
        // Actualizar la lista según el tipo de evento
        switch (e.action) {
          case 'create':
            // Añadir la nueva noticia al principio
            noticias.value.unshift(e.record)
            // Precargar imágenes para la nueva noticia
            try {
              const images = await getImagenesPorNoticia(e.record.id)
              noticiasImages.value[e.record.id] = images
            } catch (err) {
              console.warn(`No se pudieron cargar imágenes para nueva noticia ${e.record.id}:`, err)
              noticiasImages.value[e.record.id] = []
            }
            break
            
          case 'update':
            // Actualizar la noticia existente
            const index = noticias.value.findIndex(n => n.id === e.record.id)
            if (index !== -1) {
              noticias.value.splice(index, 1, e.record)
              // Actualizar imágenes si es necesario
              try {
                const images = await getImagenesPorNoticia(e.record.id)
                noticiasImages.value[e.record.id] = images
              } catch (err) {
                console.warn(`No se pudieron actualizar imágenes para noticia ${e.record.id}:`, err)
              }
            }
            break
            
          case 'delete':
            // Eliminar la noticia de la lista
            noticias.value = noticias.value.filter(n => n.id !== e.record.id)
            delete noticiasImages.value[e.record.id]
            
            // Si la noticia eliminada estaba expandida, cerrar detalles
            if (expandedNoticiaId.value === e.record.id) {
              expandedNoticiaId.value = null
            }
            
            // Si la página actual queda vacía tras borrar, retroceder una página si es posible
            if (visibleNoticias.value.length === 0 && currentPage.value > 1) {
              currentPage.value--
            }
            break
        }
      })
      
      console.log('Suscripción en tiempo real activada para noticias')
    } catch (err) {
      console.error('Error al suscribirse a actualizaciones en tiempo real:', err)
    }
  }

  // Nueva acción: Cancelar suscripción
  function unsubscribeFromRealtimeUpdates() {
    if (realtimeSubscription.value) {
      realtimeSubscription.value.unsubscribe()
      realtimeSubscription.value = null
      console.log('Suscripción en tiempo real cancelada para noticias')
    }
  }

  async function performSearch() {
    loading.value = true
    error.value = null
    try {
      if (searchTerm.value && searchTerm.value.trim().length > 0) {
        const lista = await getNoticiaByTitulo(searchTerm.value.trim())
        noticias.value = lista.slice().reverse()
      } else {
        const lista = await getListaNoticias()
        noticias.value = lista.slice().reverse()
      }

      currentPage.value = 1
      // precargar imágenes para los resultados
      for (const noticia of noticias.value) {
        try {
          const images = await getImagenesPorNoticia(noticia.id)
          noticiasImages.value[noticia.id] = images
        } catch (err) {
          noticiasImages.value[noticia.id] = []
        }
      }
    } catch (err) {
      error.value = err.message || String(err)
    } finally {
      loading.value = false
    }
  }

  function toggleDetalles(noticiaId) {
    expandedNoticiaId.value = expandedNoticiaId.value === noticiaId ? null : noticiaId
  }

  async function removeNoticia(id) {
    const ok = window.confirm('¿Eliminar esta noticia?')
    if (!ok) return
    loading.value = true
    try {
      await deleteNoticia(id)
      noticias.value = noticias.value.filter(n => n.id !== id)
      delete noticiasImages.value[id]
      if (expandedNoticiaId.value === id) expandedNoticiaId.value = null
      // si la página actual queda vacía tras borrar, retroceder una página si es posible
      if (visibleNoticias.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error('Error eliminando noticia:', err)
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

  // Limpiar suscripción cuando el store se destruya
  onUnmounted(() => {
    unsubscribeFromRealtimeUpdates()
  })

  // Retornar estado y acciones
  return {
    noticias,
    loading,
    error,
    expandedNoticiaId,
    noticiasImages,
    searchTerm,
    pageSize,
    currentPage,
    pageDirection,
    totalPages,
    visibleNoticias,
    pageTransition,
    contentKey,
    isAdminRequiredErr,
    loadNoticias,
    performSearch,
    toggleDetalles,
    removeNoticia,
    goPrev,
    goNext,
    goPrevDirectional,
    goNextDirectional,
    setSearchTerm,
    subscribeToRealtimeUpdates,    // Nueva
    unsubscribeFromRealtimeUpdates // Nueva
  }
})
