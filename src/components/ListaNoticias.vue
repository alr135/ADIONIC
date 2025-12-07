<script setup>
import { onMounted, onUnmounted } from 'vue'
import { pb } from '../backend/pb.js'
import { useRouter } from 'vue-router'
import { useNoticiasStore } from '../stores/noticiasStore.js'
import { useAuthStore } from '../stores/authStore.js'

/*
  Componente: ListaNoticias
  - Propósito: mostrar un listado paginado de noticias con búsqueda, detalles expandibles
    y eliminación. Precarga imágenes asociadas a cada noticia.

  Estado: Centralizado en `useNoticiasStore` (Pinia)
  - noticias: Array de noticias cargadas desde el servicio (mostramos oldest->newest).
  - noticiasImages: cache de imágenes por noticia { [noticiaId]: [imagenObj,...] }.
  - loading: indicador booleano de carga global.
  - error: mensaje de error cuando ocurre alguno.
  - expandedNoticiaId: id de la noticia cuyo panel de detalles está abierto (o null).
  - searchTerm: texto de búsqueda para filtrar por título.
  - currentPage: página actual (1-based).
  - pageDirection: 'next' | 'prev' — dirección de navegación para transiciones de página.
  - totalPages, visibleNoticias, pageTransition, contentKey, isAdminRequiredErr: computeds

  Métodos disponibles en el store:
  - loadNoticias(), performSearch(), toggleDetalles(), removeNoticia()
  - goPrev(), goNext(), goPrevDirectional(), goNextDirectional()

  Notas de diseño:
  - Usamos <Transition> y <TransitionGroup> para animar la búsqueda, el cambio de página,
    la entrada/salida de tarjetas y el panel de detalles (aparecer / desaparecer).
  - Precargamos imágenes por noticia para evitar saltos de layout cuando se muestran.
*/

const store = useNoticiasStore()
const router = useRouter()
const authStore = useAuthStore()

async function editarNoticia(id) {
  // Navegar a la vista de edición de noticia
  router.push(`/editar-noticia/${id}`)
}

function getNewsImageUrl(imagen) {
  if (!imagen?.url) return null
  return `${pb.baseUrl}/api/files/imagenes_noticias/${imagen.id}/${imagen.url}`
}

async function reloadNoticiasForDev() {
  store.loading = true
  store.error = null
  try {
    // previous dev-only auth (commented out):
    // try {
    //   // pb.admins.authWithPassword(<DEV_EMAIL>, <DEV_PASSWORD>)
    //   // console.log('Dev account authenticated for tests')
    // } catch (err) {
    //   // console.error('Error authenticating dev account:', err)
    // }

    // simply reload noticias without attempting dev-only auth
    await store.loadNoticias()
  } catch (err) {
    store.error = err.message || String(err)
  } finally {
    store.loading = false
  }
}

onMounted(() => {
  store.loadNoticias()
  authStore.initAuth()
  // Suscribirse a actualizaciones en tiempo real
  store.subscribeToRealtimeUpdates()
})

onUnmounted(() => {
  // Cancelar suscripción al desmontar el componente
  store.unsubscribeFromRealtimeUpdates()
})

</script>

<template>
  <section class="lista-noticias" style="margin-top: 1rem;">
    <h2 style="color:aliceblue">Listado de noticias</h2>

    <!-- Barra de búsqueda animada -->
    <Transition name="search">
      <div class="search-row">
        <input
          v-model="store.searchTerm"
          @keyup.enter="store.performSearch"
          placeholder="Buscar noticias por título..."
          class="search-input"
        />
        <button class="btn search-btn" @click="store.performSearch">Buscar</button>
        <button v-if="authStore.isAdmin" @click="$router.push('/crear-noticia')" class="btn nueva-entrada-btn">
          Nueva Noticia
        </button>
      </div>
    </Transition>

    <!-- Cambio de página / contenido principal con animación dependiente de dirección -->
    <Transition :name="store.pageTransition" mode="out-in">
      <div :key="store.contentKey">
        <div v-if="store.loading">Cargando noticias...</div>
          <div v-else-if="store.error" class="error">
          <div>Error: {{ store.error }}</div>
          <div v-if="store.isAdminRequiredErr">
            <small>Este recurso parece requerir permisos especiales (administrador).</small>
            <div>
              <button @click="reloadNoticiasForDev" class="btn">Recargar contenido (solo dev)</button>
            </div>
          </div>
        </div>

        <div v-else>
          <div v-if="store.noticias.length === 0">No hay noticias disponibles.</div>
          <div v-else>
            <!-- Lista animada: entrada/salida de tarjetas -->
            <TransitionGroup name="list" tag="div" class="noticias-container">
              <div v-for="n in store.visibleNoticias" :key="n.id" class="noticia-card" :class="{ expanded: store.expandedNoticiaId === n.id }">
                <div class="card-content">
                  <div class="noticia-card-main">
                    <div class="noticia-image">
                      <template v-if="store.noticiasImages[n.id] && store.noticiasImages[n.id].length">
                        <img :src="getNewsImageUrl(store.noticiasImages[n.id][0])" :alt="`Imagen noticia ${n.titulo}`" />
                      </template>
                      <div v-else class="noticia-imagen-placeholder">Sin imagen</div>
                    </div>
                    <div class="noticia-info">
                      <h3 class="titulo">{{ n.titulo }}</h3>
                      <div class="meta"><small v-if="n.fecha">{{ new Date(n.fecha).toLocaleDateString() }}</small></div>
                    </div>
                  </div>

                  <div class="card-actions">
                    <button @click="store.toggleDetalles(n.id)" class="btn-detalles">
                      {{ store.expandedNoticiaId === n.id ? 'Ocultar detalles' : 'Detalles' }}
                    </button>
                    <button v-if="authStore.isAdmin" @click="editarNoticia(n.id)" class="btn-editar">✎</button>
                    <button v-if="authStore.isAdmin" class="btn-eliminar" @click="store.removeNoticia(n.id)">✕</button>
                  </div>
                </div>

                <!-- Panel expandible animado -->
                <Transition name="details">
                  <div v-if="store.expandedNoticiaId === n.id" class="detalles-panel-overlay">
                    <div class="detalles-panel-content">
                      <div class="detalles-grid">
                        <div class="detalle-item">
                          <span class="value contenido-noticia">{{ n.contenido }}</span>
                        </div>
                      </div>
                      <button class="btn-mas-detalles">Más detalles</button>
                    </div>
                  </div>
                </Transition>
              </div>
            </TransitionGroup>

            <!-- Paginación debajo de las tarjetas (directional) -->
            <div class="pagination" v-if="store.totalPages > 1">
              <button class="page-btn" @click="store.goPrevDirectional" :disabled="store.currentPage === 1">‹</button>
              <span class="page-info">Página {{ store.currentPage }} / {{ store.totalPages }}</span>
              <button class="page-btn" @click="store.goNextDirectional" :disabled="store.currentPage === store.totalPages">›</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>



<style scoped>
/*
Layout principal
.lista-noticias contiene el padding y separación superior.
h2 controla el espaciado del título.
*/
.lista-noticias { margin-top: 1rem; padding: 0 1rem; margin: auto; max-width: 1200px; }
h2 { margin-bottom: 1.5rem; }

/*
Grid de tarjetas de noticias
.noticias-container define la grilla responsive.
.noticia-card estructura y estilos base de cada tarjeta.
.noticia-card-main, .noticia-image, .noticia-info controlan el layout interno.
*/
.noticias-container { display: grid; gap: 1.5rem; max-width: 1200px; grid-template-columns: repeat(3, minmax(240px, 1fr)); justify-content: center; }
.noticia-card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; background: #fff; }
.noticia-card-main { display:flex; gap:1rem; align-items:flex-start }
.noticia-image { width:150px; height:100px; overflow:hidden; border-radius:8px; background:#f5f5f5; display:flex; align-items:center; justify-content:center }
.noticia-image img { width:100%; height:100%; object-fit:cover }
.noticia-imagen-placeholder { color:#999 }
.noticia-info .titulo { margin:0; color:#222 }
.noticia-info .meta small { color:#333 }

/*
Acciones y botones
.card-actions agrupa botones.
.btn-detalles y .btn-eliminar son estilos visuales y tamaños.
*/
.card-actions { display:flex; gap:.5rem; margin-top:.5rem }
.btn-detalles { padding:.6rem 1.2rem; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer }
.btn-detalles:hover { background:#0056b3 }
.btn-editar { padding:.45rem .8rem; background:#ffc107; color:#212529; border:none; border-radius:4px; cursor:pointer; font-size:0.95rem }
.btn-editar:hover { background: #e0a800; }
.btn-eliminar { padding:.45rem .8rem; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:0.95rem }
.btn-eliminar:hover { background:#b02a37 }

/*
Panel de detalles expandible
.detalles-panel y .detalles-panel-content son el overlay que aparece
position:absolute en .detalles-panel-overlay es para posicionarlo bajo la tarjeta
*/
.detalles-panel { margin-top:1rem; padding:1rem; background:#f9f9f9; border-left:4px solid #007bff; border-radius:4px }
.detalles-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem }
.detalle-item { margin:0; color:#222 }
.btn-mas-detalles { padding:.6rem 1.2rem; background:#28a745; color:#fff; border:none; border-radius:4px }

/*
Texto largo truncado
.contenido-noticia limita a ~5 líneas usando -webkit-line-clamp y fallback
se evita overflow y se añade '...' visual en navegadores sin -webkit-line-clamp
*/
.contenido-noticia { display: -webkit-box; line-clamp: 5; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 7em; }
@supports not (-webkit-line-clamp: 5) { .contenido-noticia { position: relative; max-height: 7em; overflow: hidden; } .contenido-noticia::after { content: '...'; position: absolute; bottom: 0; right: 0; background: white; padding-left: 4px; } }

/*
Responsividad
Media queries para ajustar número de columnas en pantallas pequeñas
*/
@media (max-width:1000px){ .noticias-container{ grid-template-columns:repeat(2, minmax(320px,1fr)) } }
@media (max-width:640px){ .noticias-container{ grid-template-columns:1fr } }

/*
Helpers visuales y paginación
colores de texto, paddings y botones de paginación
*/
.noticia-card .titulo, .noticia-card .meta { color: #222 }
.pagination { display:flex; gap:.75rem; align-items:center; justify-content:center; margin-top:1rem }
.page-btn { padding:.4rem .8rem; border-radius:4px; border:1px solid #ccc; background:#fff; cursor:pointer }
.page-btn:disabled { opacity:.45; cursor:not-allowed }
.page-info { font-weight:600 }

/*
Barra de búsqueda
.search-row centra y espacia la barra. .search-input controla foco y tamaño.
*/
.search-row { display: flex; gap: 0.75rem; margin-bottom: 2rem; margin-top: 1.5rem; width: 100%; max-width: 600px; }
.search-input { flex: 1; padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s ease; }
.search-input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1); }
.btn { padding: 0.6rem 1.2rem; margin-top: 0.5rem; background: #ffc107; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s ease; }
.btn:hover { background: #ffb300; color: #ffffff; }
.search-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1rem; white-space: nowrap; }
.nueva-entrada-btn {
  background: #28a745;
  color: white;
}
.nueva-entrada-btn:hover {
  background: #218838;
}

/*
Overlay y stacking
.noticia-card y .card-content aseguran que el overlay quede encima o debajo apropiadamente
*/
.noticia-card { position: relative; margin-bottom: 0; }
.noticia-card.expanded { z-index: 10; }
.card-content { position: relative; z-index: 2; background: #fff; }
.detalles-panel-overlay { position: absolute; top: 100%; left: 0; right: 0; z-index: 1; margin-top: 0.5rem; }
.detalles-panel-content { background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-left: 4px solid #007bff; animation: slideDown 0.3s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.noticias-container { position: relative; }

/*
Transiciones (lista, búsqueda, detalles, paginación)
Clases para animar entradas y salidas de items, búsqueda y cambios de página.
Las clases page-next y page-prev permiten animación dependiente de la dirección.
*/
.list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from { opacity: 0; transform: translateY(30px); }
.list-leave-to { opacity: 0; transform: translateY(-30px); }
.list-leave-active { width: 100%; }
.search-enter-active, .search-leave-active { transition: all 0.4s ease; }
.search-enter-from { opacity: 0; transform: translateY(-20px); }
.search-leave-to { opacity: 0; transform: translateY(-20px); }
.content-enter-active, .content-leave-active { transition: all 0.4s ease; }
.content-enter-from { opacity: 0; transform: translateY(20px); }
.content-leave-to { opacity: 0; transform: translateY(-20px); }
.empty-enter-active, .empty-leave-active { transition: all 0.3s ease; }
.empty-enter-from { opacity: 0; transform: scale(0.9); }
.empty-leave-to { opacity: 0; transform: scale(0.9); }
.image-enter-active, .image-leave-active { transition: all 0.3s ease; }
.image-enter-from { opacity: 0; transform: scale(0.8); }
.image-leave-to { opacity: 0; transform: scale(1.1); }
.details-enter-active, .details-leave-active { transition: all 0.3s ease; }
.details-enter-from { opacity: 0; transform: translateY(-10px) scale(0.95); }
.details-leave-to { opacity: 0; transform: translateY(10px) scale(0.95); }
.pagination-enter-active, .pagination-leave-active { transition: all 0.3s ease; }
.pagination-enter-from { opacity: 0; transform: translateY(20px); }
.pagination-leave-to { opacity: 0; transform: translateY(-20px); }
.page-next-enter-active, .page-next-leave-active, .page-prev-enter-active, .page-prev-leave-active { transition: all 0.45s ease; }
.page-next-enter-from { opacity: 0; transform: translateX(30px); }
.page-next-leave-to { opacity: 0; transform: translateX(-30px); }
.page-prev-enter-from { opacity: 0; transform: translateX(-30px); }
.page-prev-leave-to { opacity: 0; transform: translateX(30px); }
</style>