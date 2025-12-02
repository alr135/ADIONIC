<script setup>

import { ref, watch } from 'vue';

/**
 * Componente: CaballoForm
 *    - ¿Qué hace?: Se trata de un formulario reutilizable para la edición y creación 
 *      de los caballos. Mediante los datos del formularios, en las respectivas vistas de 
 *      de CrearCaballo y EditarCaballo se envía una petición al backend para que sea
 *      procesada
 *    - Eventos procesados/generados: Generará un evento al pulsar el botón de submit que
 *      posteriormente será capturado por la correspondiente vista. Procesará los campos
 *      de entrada para ver si están vacios o no junto con los valores ya existentes de un
 *      caballo que recibirá al cargarse desde la vista de EditarCaballo para ser cargados
 *      en los correspondientes campos
 * Estado: Local (ref) :
 *    - form: Objeto que contiene los campos del formulario que posteriormente se pasarán
 *      a la correspondiente vista para que esta lo procese. Este contiene todas las
 *      propiedades del caballo:
 *          nombre, descripcion, descripcion_larga, color, sexo,
 *          fecha_nacimiento, fecha_retiramiento, fecha_fallecimiento,
 *          duenyo, entrenador, hogar.
 *      Se actualiza vía v-model y se fusiona con initial si se recibe.
 * Notas de diseño:
 *    - Se han usado para layout y estilos varias clases de Bootstrap (card, row, 
 *      col, form-control). 
 *    - El formulario es un componente controlado, por lo que todos los campos están
 *      vinculados al estado local `form` mediante `v-model`.
 *    - El componente acepta una prop `initial` para inicializar los campos del formulario,
 *      usado principalmente para la edición
 *    - Usamos <Transition> y <TransitionGroup> para animar la carga de la tarjeta de
 *      Bootstrap en la que se encuentra el formulario.
 *    
 */

// Definición de eventos emitidos por el componente
const emit = defineEmits(['submit'])

// Definición de props recibidas por el componente
const props = defineProps({
  // Carga los datos iniciales para modo "editar"
  initial: { type: Object, default: () => ({}) },
  // Texto del botón de submit
  submitLabel: { type: String, default: 'Guardar' },
  // Deshabilitar el submit desde fuera si hace falta
  disabled: { type: Boolean, default: false },
})

// Estado local del formulario. Almacena los datos dael caballo
const form = ref({
  nombre: '',
  descripcion: '',
  descripcion_larga: '',
  color: '',
  sexo: '',
  fecha_nacimiento: '',
  fecha_retiramiento: '',
  fecha_fallecimiento: '',
  duenyo: '',
  entrenador: '',
  hogar: '',
})

// Carga los datos iniciales de un caballo para la edición
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
    <div class="caballo-form card shadow-sm p-4">
      <h2 class="h4 mb-3">Formulario de Caballo</h2>
      <div key="caballo-form-content">
        <form @submit.prevent="onSubmit">
          <div class="mb-3">
            <label for="nombre" class="form-label">Nombre</label>
            <input class="form-control" type="text" id="nombre" v-model="form.nombre" required />
          </div>
          <div class="mb-3">
            <label for="descripcion" class="form-label">Descripción</label>
            <input class="form-control" type="text" id="descripcion" v-model="form.descripcion" required />
          </div>
          <div class="mb-3">
            <label for="descripcionLarga" class="form-label">Descripción larga</label>
            <textarea class="form-control" id="descripcionLarga" v-model="form.descripcion_larga" rows="3" required></textarea>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="color" class="form-label">Color</label>
              <input class="form-control" type="text" id="color" v-model="form.color" required />
            </div>
            <div class="col-md-4 mb-3">
              <label for="sexo" class="form-label">Sexo</label>
              <input class="form-control" type="text" id="sexo" v-model="form.sexo" required />
            </div>
            <div class="col-md-4 mb-3">
              <label for="fechaNacimiento" class="form-label">Nacimiento</label>
              <input class="form-control" type="date" id="fechaNacimiento" v-model="form.fecha_nacimiento" />
            </div>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="fechaRetiro" class="form-label">Retiro</label>
              <input class="form-control" type="date" id="fechaRetiro" v-model="form.fecha_retiramiento" />
            </div>
            <div class="col-md-4 mb-3">
              <label for="fechaFallecimiento" class="form-label">Fallecimiento</label>
              <input class="form-control" type="date" id="fechaFallecimiento" v-model="form.fecha_fallecimiento" />
            </div>
            <div class="col-md-4 mb-3">
              <label for="duenyo" class="form-label">Dueño</label>
              <input class="form-control" type="text" id="duenyo" v-model="form.duenyo" required />
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="entrenador" class="form-label">Entrenador</label>
              <input class="form-control" type="text" id="entrenador" v-model="form.entrenador" required />
            </div>
            <div class="col-md-6 mb-3">
              <label for="hogar" class="form-label">Hogar</label>
              <input class="form-control" type="text" id="hogar" v-model="form.hogar" required />
            </div>
          </div>
          <button type="submit" :disabled="disabled" class="btn btn-success w-100">{{ submitLabel }}</button>
        </form>
      </div>

    </div>
  </Transition>
</template>

<style scoped>
.caballo-form {
    min-width: 240px;
    margin: auto;
}

/* Transitions for mount/unmount of the form content */
.content-enter-active, .content-leave-active, .content-appear-active { transition: all 0.4s ease; }
.content-enter-from, .content-appear-from { opacity: 0; transform: translateY(20px); }
.content-leave-to { opacity: 0; transform: translateY(-20px); }

.caballo-form div {
    margin-bottom: 1rem;
}

.caballo-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

.caballo-form input {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
}
.caballo-form button {
    padding: 0.75rem 1.5rem;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>