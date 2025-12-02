<script setup>
import ListaCaballos from '../components/ListaCaballos.vue'
import AppHeader from '../components/AppHeader.vue';
import { IonPage, IonContent } from '@ionic/vue';
</script>

<template>
  <ion-page>
    <AppHeader />
    <ion-content>
      <main class="app-container">
        <ListaCaballos />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.app-container {
  margin-top: 1rem;
  margin-bottom: 1.6rem;
}
</style>