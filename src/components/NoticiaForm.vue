<script setup>

import { ref, watch, onMounted } from 'vue';
import { useCaballosStore } from '../stores/caballosStore.js';

/**
 * Componente: NoticiaForm
 *    - ¿Qué hace?: Se trata de un formulario reutilizable para la edición y creación 
 *      de las noticias. Mediante los datos del formularios, en las respectivas vistas de 
 *      de CrearNoticia y EditarNoticia se envía una petición al backend para que sea
 *      procesada
 *    - Eventos procesados/generados: Generará un evento al pulsar el botón de submit que
 *      posteriormente será capturado por la correspondiente vista. Procesará los campos
 *      de entrada para ver si están vacios o no junto con los valores ya existentes de un
 *      noticia que recibirá al cargarse desde la vista de EditarNoticia para ser cargados
 *      en los correspondientes campos
 * Estado: Local (ref) :
 *    - form: Objeto que contiene los campos del formulario que posteriormente se pasarán
 *      a la correspondiente vista para que esta lo procese. Este contiene todas las
 *      propiedades de la noticia:
 *          titulo, contenido, fecha, url_video, caballo_id
 *      Se actualiza vía v-model y se fusiona con initial si se recibe.
 * Estado: Distribuido (caballosStore [Pinia]) : 
 *    - caballosStore: Store que contiene la lista de caballos disponibles en el sistema.
 *      Se usa para poblar el select de caballos relacionados en el formulario.
 * 
 *      Propiedades disponibles en la store:
 *      + caballos: lista completa de caballos (ordenada oldest->newest)
 *      + loading: indicador de carga
 *      + error: mensaje de error si ocurre alguno
 *      + expandedCaballoId: id del caballo cuyo panel de detalles está abierto
 *      + caballoImages: cache de imágenes por caballo
 *      + searchTerm: texto de búsqueda
 *      + currentPage: página actual
 *      + pageDirection: dirección de navegación
 *      + totalPages, visibleCaballos, pageTransition, contentKey, isAdminRequiredErr: computeds
 *      
 *      Métodos disponibles en la store:
 *        - loadCaballos(), performSearch(), toggleDetalles(), removeCaballo()
 *        - goPrev(), goNext(), goPrevDirectional(), goNextDirectional()
 * 
 *     Nota sobre la store:
 *        Solamente se usa dentro de este componente la propiedad caballos y el método
 *        loadCaballos para tener los caballos cargados en el select del formulario
 *        usado para indicar a que caballo se encuentra relacionada la noticia.
 *      
 * Notas de diseño:
 *    - Se han usado para layout y estilos varias clases de Bootstrap (card, row,
 *      col, form-control).
 *    - El formulario es un componente controlado, por lo que todos los campos están
 *      vinculados a un estado local reactivo.
 *    - El componente acepta una prop `initial` para inicializar los campos del formulario,
 *    - Usamos <Transition> y <TransitionGroup> para animar la carga de la tarjeta de
 *      Bootstrap en la que se encuentra el formulario.
 */

// Definición de eventos emitidos por el componente
const emit = defineEmits(['submit'])

// Definición de props recibidas por el componente
const props = defineProps({
  // Datos iniciales para modo "editar"
  initial: { type: Object, default: () => ({}) },
  // Texto del botón
  submitLabel: { type: String, default: 'Guardar' },
  // Deshabilitar el submit desde fuera si hace falta
  disabled: { type: Boolean, default: false },
})

// Inicializar el store
const caballosStore = useCaballosStore()

// Estado local del formulario. Almacena los datos de la noticia
const form = ref({
  titulo: '',
  contenido: '',
  fecha: '',
  url_video: '',
  caballo_id: ''
})

// Se cargan los caballos al cargar el componente
onMounted(async () => {
  // Cargar caballos si no están ya cargados
  if (caballosStore.caballos.length === 0) {
    await caballosStore.loadCaballos()
  }
})

// Carga inicial de datos en el formulario
function applyInitial(data) {
  if (!data) return
  form.value = { ...form.value, ...data }
}

// Inicializa y reacciona a cambios en initial (útil al cargar datos de edición)
applyInitial(props.initial)
watch(() => props.initial, (val) => applyInitial(val), { deep: true })

// Maneja el envío del formulario
function onSubmit() {
  // JSON-ready payload
  emit('submit', { ...form.value })
}

</script>

<template>
  <Transition name="content" mode="out-in" appear>
    <div class="noticia-form card shadow-sm p-4">
    <h2 class="h4 mb-3">Formulario de Noticia</h2>
      <div key="noticia-form-content">
        <form @submit.prevent="onSubmit">
          <div class="mb-3">
            <label for="titulo" class="form-label">Título</label>
            <input class="form-control" type="text" id="titulo" v-model="form.titulo" required />
          </div>
          <div class="mb-3">
            <label for="contenido" class="form-label">Contenido</label>
            <textarea class="form-control" id="contenido" v-model="form.contenido" rows="4" required></textarea>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="fecha" class="form-label">Fecha</label>
              <input class="form-control" type="date" id="fecha" v-model="form.fecha" required />
            </div>
            <div class="col-md-8 mb-3">
              <label for="url_video" class="form-label">URL Video</label>
              <input class="form-control" type="url" id="url_video" v-model="form.url_video" />
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Caballo relacionado</label>
            <select class="form-select" v-model="form.caballo_id">
              <option value="">Ninguno</option>
              <option v-for="caballo in caballosStore.caballos" :key="caballo.id" :value="caballo.id">
                {{ caballo.nombre }}
              </option>
            </select>
          </div>
          <button type="submit" :disabled="disabled" class="btn btn-success w-100">{{ submitLabel }}</button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.noticia-form {
    min-width: 240px;
    margin: auto;
}

/* Transitions for mount/unmount of the form content */
.content-enter-active, .content-leave-active, .content-appear-active { transition: all 0.4s ease; }
.content-enter-from, .content-appear-from { opacity: 0; transform: translateY(20px); }
.content-leave-to { opacity: 0; transform: translateY(-20px); }

.noticia-form div {
    margin-bottom: 1rem;
}

.noticia-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

.noticia-form textarea {
    width: 100%;
    height: 100px;
    padding: 0.5rem;
    box-sizing: border-box;
}

.noticia-form input {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
}
.noticia-form button {
    padding: 0.75rem 1.5rem;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.noticia-form select {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
}

</style>