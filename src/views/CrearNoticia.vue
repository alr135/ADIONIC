<script setup>

import NoticiaForm from '../components/NoticiaForm.vue'
import { useRouter } from 'vue-router';
import { createNoticia, createNoticiaCaballo } from '../backend/noticiaService';

const router = useRouter();

async function handleCrearNoticia(payload){
  const caballoId = payload.caballo_id;
  delete payload.caballo_id;
  const params_noticiacaballo = {
          idNoticia: null, // Se asignará después de crear la noticia
          idCaballo: caballoId
  }; 
  
    try {
        const noticia = await createNoticia(payload);
        alert('Noticia creada con éxito');

        params_noticiacaballo.idNoticia = noticia.id;
        
        router.push('/noticias'); // Redirigir a la página principal de noticias
    } catch (error) {
        alert('Error al crear la noticia: ' + error.message);
    }
 
    try {

      if (params_noticiacaballo.idNoticia && params_noticiacaballo.idCaballo) {
          await createNoticiaCaballo(params_noticiacaballo);
          alert('Noticia asociada al caballo con éxito');
      }else{
          console.log('No se pudo asociar la noticia al caballo: faltan IDs');
      }     
    } catch (error) {
        alert('Error al asociar la noticia con el caballo: ' + error.message);
    }
}

</script>

<template>
  <main>
    <NoticiaForm submit-label="Crear Noticia" @submit="handleCrearNoticia"/>

  </main>
</template>