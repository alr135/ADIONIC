<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CaballoForm from '../components/CaballoForm.vue'
import { getCaballoById, updateCaballo } from '../backend/caballoService'
import { IonPage, IonContent } from '@ionic/vue';

const route = useRoute()
const router = useRouter()
const initial = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    initial.value = await getCaballoById(route.params.id)
  } catch (e) {
    error.value = e?.message || String(e)
  }
})

async function handleUpdate(payload) {
  try {
    await updateCaballo(route.params.id, payload)
    alert('Caballo actualizado con éxito')
    router.push('/')
  } catch (e) {
    alert('Error al actualizar: ' + (e?.message || String(e)))
  }
}
</script>

<template>
  <ion-page>
    <ion-content>
      <main>
        <p v-if="!initial && !error">Cargando…</p>
        <p v-else-if="error" style="color:#b00020">Error: {{ error }}</p>
        <CaballoForm
          v-else
          :initial="initial"
          submitLabel="Guardar cambios"
          @submit="handleUpdate"
        />
      </main>
    </ion-content>
  </ion-page>
</template>