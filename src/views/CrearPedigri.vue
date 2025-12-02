<script setup>
import PedigriForm from '../components/PedigriForm.vue';
import { IonPage, IonContent } from '@ionic/vue';
import AppHeader from '../components/AppHeader.vue';
</script>

<template>
    <ion-page>
        <AppHeader />
        <ion-content>
            <main>
                <PedigriForm />
            </main>
        </ion-content>
    </ion-page>
</template>