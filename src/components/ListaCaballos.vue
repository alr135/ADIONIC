<script setup>
import { onMounted } from 'vue'
import { pb } from '../backend/pb.js'
import { useRouter } from 'vue-router'
import { useCaballosStore } from '../stores/caballosStore.js'
import { useAuthStore } from '../stores/authStore.js'

/*
  Componente: ListaCaballos
  - Qué hace: muestra un listado de tarjetas de caballos consumiendo el store centralizado `useCaballosStore`.
    Permite buscar por nombre, paginar (9 tarjetas por página), expandir detalles inline y eliminar elementos.
  - Eventos procesados/generados: no emite eventos personalizados; procesa clicks locales (detalles, eliminar,
    navegación de páginas y búsqueda).

  Estado: Centralizado en `useCaballosStore` (Pinia)
  - caballos: lista completa de caballos (ordenada oldest->newest)
  - loading: indicador de carga
  - error: mensaje de error si ocurre alguno
  - expandedCaballoId: id del caballo cuyo panel de detalles está abierto
  - caballoImages: cache de imágenes por caballo
  - searchTerm: texto de búsqueda
  - currentPage: página actual
  - pageDirection: dirección de navegación
  - totalPages, visibleCaballos, pageTransition, contentKey, isAdminRequiredErr: computeds

  Métodos disponibles en el store:
  - loadCaballos(), performSearch(), toggleDetalles(), removeCaballo()
  - goPrev(), goNext(), goPrevDirectional(), goNextDirectional()

  Props: ninguno.

*/

const store = useCaballosStore()
const router = useRouter()
const authStore = useAuthStore()

async function editarCaballo(id) {
  // Navegar a la ruta de edición del caballo
  router.push(`/editar-caballo/${id}`)
}

function getImageUrl(imagen) {
  if (!imagen?.url) return null
  // usa la colección "imagenes" y el ID del registro de imagen
  return `${pb.baseUrl}/api/files/imagenes/${imagen.id}/${imagen.url}`
}

async function reloadCaballosForDev() {
  store.loading = true
  store.error = null
  try {
    // try {
    //   // pb.admins.authWithPassword(<DEV_EMAIL>, <DEV_PASSWORD>)
    //   // console.log('Dev account authenticated for tests')
    // } catch (err) {
    //   // console.error('Error authenticating dev account:', err)
    // }

    await store.loadCaballos()
  } catch (err) {
    store.error = err.message || String(err)
  } finally {
    store.loading = false
  }
}

onMounted(() => {
  store.loadCaballos()
  
})
</script>

<template>
  <section class="lista-caballos">
    <h2 style="color:aliceblue">Listado de caballos</h2>

    <Transition name="search">
      <div class="search-row">
        <input 
          v-model="store.searchTerm" 
          @keyup.enter="store.performSearch" 
          placeholder="Buscar caballos por nombre..." 
          class="search-input"
        />
        <button class="btn search-btn" @click="store.performSearch">Buscar</button>
      </div>
    </Transition>

    <Transition :name="store.pageTransition" mode="out-in">
      <div :key="store.contentKey">
        <div v-if="store.loading">Cargando caballos...</div>
        <div v-else-if="store.error" class="error">
          <div>Error: {{ store.error }}</div>
          <div v-if="store.isAdminRequiredErr">
            <small>Este recurso parece requerir permisos especiales (administrador).</small>
            <div>
              <button @click="reloadCaballosForDev" class="btn">Recargar contenido (solo dev)</button>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="store.caballos.length === 0">No hay caballos disponibles.</div>
          <div v-else>
            <TransitionGroup name="list" tag="div" class="caballos-container">
              <div v-for="c in store.visibleCaballos" :key="c.id" class="caballo-card" :class="{ expanded: store.expandedCaballoId === c.id }">
                <!-- Contenido existente de la tarjeta -->
                <div class="card-content">
                  <div class="caballo-header">
                    <div class="caballo-info">
                      <h3>{{ c.nombre }}</h3>
                      <p v-if="c.descripcion" class="descripcion">{{ c.descripcion }}</p>
                    </div>
                    <div v-if="store.caballoImages[c.id]?.length > 0" class="caballo-imagen">
                      <img 
                        :src="getImageUrl(store.caballoImages[c.id][0])" 
                        :alt="`Imagen de ${c.nombre}`" 
                        class="imagen-thumb"
                      >
                    </div>
                    <div v-else class="caballo-imagen-placeholder">
                      <span>Sin imagen</span>
                    </div>
                  </div>

                  <!-- Botones: detalles + eliminar -->
                  <div class="card-actions">
                    <button @click="store.toggleDetalles(c.id)" class="btn-detalles">
                      {{ store.expandedCaballoId === c.id ? 'Ocultar detalles' : 'Detalles' }}
                    </button>
                    <button v-if="authStore.isAdmin" @click="editarCaballo(c.id)" class="btn-editar">✎</button>
                    <button v-if="authStore.isAdmin" class="btn-eliminar" @click="store.removeCaballo(c.id)" title="Eliminar caballo">✕</button>
                  </div>
                </div>

                <!-- Panel expandible con detalles adicionales -->
                <Transition name="details">
                  <div v-if="store.expandedCaballoId === c.id" class="detalles-panel-overlay">
                    <div class="detalles-panel-content">
                      <div class="detalles-grid">
                        <div v-if="c.color" class="detalle-item">
                          <span class="label">Color:</span>
                          <span class="value">{{ c.color }}</span>
                        </div>
                        <div v-if="c.sexo" class="detalle-item">
                          <span class="label">Sexo:</span>
                          <span class="value">{{ c.sexo }}</span>
                        </div>
                        <div v-if="c.fecha_nacimiento" class="detalle-item">
                          <span class="label">Nacimiento:</span>
                          <span class="value">{{ c.fecha_nacimiento }}</span>
                        </div>
                        <div v-if="c.fecha_retiramiento" class="detalle-item">
                          <span class="label">Retiramiento:</span>
                          <span class="value">{{ c.fecha_retiramiento }}</span>
                        </div>
                        <div v-if="c.fecha_fallecimiento" class="detalle-item">
                          <span class="label">Fallecimiento:</span>
                          <span class="value">{{ c.fecha_fallecimiento }}</span>
                        </div>
                        <div v-if="c.duenyo" class="detalle-item">
                          <span class="label">Dueño:</span>
                          <span class="value">{{ c.duenyo }}</span>
                        </div>
                        <div v-if="c.entrenador" class="detalle-item">
                          <span class="label">Entrenador:</span>
                          <span class="value">{{ c.entrenador }}</span>
                        </div>
                        <div v-if="c.hogar" class="detalle-item">
                          <span class="label">Hogar:</span>
                          <span class="value">{{ c.hogar }}</span>
                        </div>
                      </div>
                      <button class="btn-mas-detalles">Más detalles</button>
                    </div>
                  </div>
                </Transition>
              </div>
            </TransitionGroup>

            <!-- Paginación: flechas debajo de las tarjetas -->
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
.lista-caballos padding y espaciado del título
*/
.lista-caballos { margin-top: 1rem; padding: 0 1rem; margin: auto; max-width: 1200px; }
h2 { margin-bottom: 1.5rem; }

/*
Grid de tarjetas de caballos
.caballos-container define la grilla responsive
.caballo-card estilos base y sombra en hover
*/
.caballos-container { position: relative; display: grid; gap: 1rem; max-width: 1200px; grid-template-columns: repeat(3, minmax(240px, 1fr)); justify-content: center; }
.card-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.btn-eliminar { padding: 0.45rem 0.8rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; }
.btn-eliminar:hover { background: #b02a37; }
.btn-editar { padding:.45rem .8rem; background:#ffc107; color:#212529; border:none; border-radius:4px; cursor:pointer; font-size:0.95rem }
.btn-editar:hover { background: #e0a800; }

/* Responsividad: 2 cols under 1000px, 1 col under 640px */
@media (max-width: 1000px) { .caballos-container { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .caballos-container { grid-template-columns: 1fr; } }

.caballo-card { position: relative; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; background: #fff; transition: box-shadow 0.3s ease; }
.caballo-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }

/*
Encabezado de tarjeta y avatar
.caballo-header organiza la info/texto y la imagen
*/
.caballo-header { display: flex; gap: 1.5rem; margin-bottom: 1rem; align-items: flex-start; }
.caballo-info { flex: 1; }
.caballo-info h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #333; }
.caballo-info .descripcion { margin: 0; color: #666; line-height: 1.5; font-size: 0.95rem; }
.caballo-imagen { flex-shrink: 0; width: 150px; height: 150px; overflow: hidden; border-radius: 8px; background: #f5f5f5; }
.caballo-imagen img { width: 100%; height: 100%; object-fit: cover; }
.caballo-imagen-placeholder { flex-shrink: 0; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 8px; color: #999; font-size: 0.9rem; }

/*
Botones y acciones
.btn-detalles y .btn-mas-detalles colores y estados hover
*/
.btn-detalles { padding: 0.6rem 1.2rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s ease; }
.btn-detalles:hover { background: #0056b3; }
.detalles-panel { margin-top: 1rem; padding: 1rem; background: #f9f9f9; border-left: 4px solid #007bff; border-radius: 4px; animation: slideDown 0.3s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.detalles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.detalle-item { display: flex; flex-direction: column; gap: 0.25rem; }
.detalle-item .label { font-weight: 600; color: #555; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
.detalle-item .value { color: #333; font-size: 0.95rem; }
.btn-mas-detalles { padding: 0.6rem 1.2rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s ease; }
.btn-mas-detalles:hover { background: #218838; }

/*
Mensajes y utilidades
.error, .btn y estilos auxiliares
*/
.error { padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24; margin-bottom: 1rem; }
.error small { display: block; margin-top: 0.5rem; }
.btn { padding: 0.6rem 1.2rem; margin-top: 0.5rem; background: #ffc107; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s ease; }
.btn:hover { background: #ffb300; }

/*
Paginación, búsqueda y helpers
estilos compactos para paginación y barra de búsqueda
*/
.pagination { display:flex; gap:.75rem; align-items:center; justify-content:center; margin-top:1rem }
.page-btn { padding:.4rem .8rem; border-radius:4px; border:1px solid #ccc; background:#fff; cursor:pointer }
.page-btn:disabled { opacity:.45; cursor:not-allowed }
.page-info { font-weight:600 }
.search-row { display: flex; gap: 0.75rem; margin-bottom: 2rem; margin-top: 1.5rem; width: 100%; max-width: 600px; }
.search-input { flex: 1; padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s ease; }
.search-input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1); }
.search-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1rem; white-space: nowrap; }
.caballo-card { position: relative; margin-bottom: 0; }
.caballo-card.expanded { z-index: 10; }
.card-content { position: relative; z-index: 2; background: #fff; }
.detalles-panel-overlay { position: absolute; top: 100%; left: 0; right: 0; z-index: 1; margin-top: 0.5rem; }
.detalles-panel-content { background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-left: 4px solid #007bff; animation: slideDown 0.3s ease; }

/*
Transiciones y animaciones
clases para animar lista, búsqueda, imágenes, detalles y cambios de página
*/
.lista-enter-active, .lista-leave-active { transition: all 0.5s ease; }
.lista-enter-from { opacity: 0; transform: translateY(30px); }
.lista-leave-to { opacity: 0; transform: translateY(-30px); }
.lista-leave-active { position: absolute; width: 100%; }
.search-enter-active, .search-leave-active { transition: all 0.4s ease; }
.search-enter-from { opacity: 0; transform: translateY(-20px); }
.search-leave-to { opacity: 0; transform: translateY(-20px); }
.content-enter-active, .content-leave-active { transition: all 0.4s ease; }
.content-enter-from { opacity: 0; transform: translateY(20px); }
.content-leave-to { opacity: 0; transform: translateY(-20px); }
.empty-enter-active, .empty-leave-active { transition: all 0.3s ease; }
.empty-enter-from { opacity: 0; transform: scale(0.9); }
.empty-leave-to { opacity: 0; transform: scale(0.9); }
.list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from { opacity: 0; transform: translateX(30px) scale(0.95); }
.list-leave-to { opacity: 0; transform: translateX(-30px) scale(0.95); }
.list-leave-active { width: 100%; }
.image-enter-active, .image-leave-active { transition: all 0.3s ease; }
.image-enter-from { opacity: 0; transform: scale(0.8); }
.image-leave-to { opacity: 0; transform: scale(1.1); }
.details-enter-active, .details-leave-active { transition: all 0.3s ease; }
.details-enter-from { opacity: 0; transform: translateY(-10px) scale(0.95); }
.details-leave-to { opacity: 0; transform: translateY(10px) scale(0.95); }
.pagination-enter-active, .pagination-leave-active { transition: all 0.3s ease; }
.pagination-enter-from { opacity: 0; transform: translateY(20px); }
.pagination-leave-to { opacity: 0; transform: translateY(-20px); }
.page-change-enter-active, .page-change-leave-active { transition: all 0.4s ease; }
.page-change-enter-from { opacity: 0; transform: translateX(50px); }
.page-change-leave-to { opacity: 0; transform: translateX(-50px); }
.page-next-enter-active, .page-next-leave-active, .page-prev-enter-active, .page-prev-leave-active { transition: all 0.45s ease; }
.page-next-enter-from { opacity: 0; transform: translateX(30px); }
.page-next-leave-to { opacity: 0; transform: translateX(-30px); }
.page-prev-enter-from { opacity: 0; transform: translateX(-30px); }
.page-prev-leave-to { opacity: 0; transform: translateX(30px); }
</style>
