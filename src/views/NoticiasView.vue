<script setup>
import ListaNoticias from '../components/ListaNoticias.vue'
import { IonPage, IonContent } from '@ionic/vue';
import AppHeader from '../components/AppHeader.vue';
</script>

<template>
  <ion-page>
    <AppHeader />
    <ion-content>
      <main>
        <ListaNoticias />
      </main>
    </ion-content>
  </ion-page>
</template>

<!-- Para usar estilo luego cuando estén las cosas funcionando
<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
-->

