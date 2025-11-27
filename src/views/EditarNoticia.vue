<script setup>

import NoticiaForm from '../components/NoticiaForm.vue'
import { useRouter, useRoute } from 'vue-router';
import { updateNoticia, getNoticiaById } from '../backend/noticiaService';
import { ref, onMounted } from 'vue'

/**
 * 
 * Vista para editar una noticia existente. Se carga la noticia por su ID
 * y se muestra un formulario con los datos actuales. Al enviar el formulario,
 * se actualiza la noticia y se redirige a la lista de noticias.
 * 
 */

const route = useRoute()
const router = useRouter()
const initial = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    initial.value = await getNoticiaById(route.params.id)
  } catch (e) {
    error.value = e?.message || String(e)
  }
})

async function handleEditarNoticia(payload){
    try {
        await updateNoticia(payload);
        alert('Noticia editada con éxito');
        router.push('/noticias'); // Redirigir a la página principal de noticias
    } catch (error) {
        alert('Error al editar la noticia: ' + error.message);
    }
}


</script>

<template>
    <main>
        <p v-if="!initial && !error">Cargando…</p>
        <p v-else-if="error" style="color:#b00020">Error: {{ error }}</p>
        <NoticiaForm
            v-else
            :initial="initial"
            submitLabel="Guardar cambios"
            @submit="handleEditarNoticia"
        />
    </main>
</template>