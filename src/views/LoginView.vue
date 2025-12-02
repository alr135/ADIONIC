<script setup>
import LoginForm from '../components/LoginForm.vue'
import { IonPage, IonContent } from '@ionic/vue';
import AppHeader from '../components/AppHeader.vue';
</script>

<template>
  <ion-page>
    <AppHeader />
    <ion-content>
      <main>
        <LoginForm />
      </main>
    </ion-content>
  </ion-page>
</template>