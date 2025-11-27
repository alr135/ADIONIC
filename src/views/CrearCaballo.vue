<script setup>

import CaballoForm from '../components/CaballoForm.vue'
import { useRouter } from 'vue-router';
import { createCaballo } from '../backend/caballoService';

const router = useRouter();

async function handleCrearCaballo(payload){
    try {
        await createCaballo(payload);
        alert('Caballo creado con éxito');
        router.push('/'); // Redirigir a la página principal (ListaCaballos)
    } catch (error) {
        alert('Error al crear el caballo: ' + error.message);
    }
}

</script>

<template>
  <main>
    <CaballoForm submit-label="Crear Caballo" @submit="handleCrearCaballo"/>

  </main>
</template>
