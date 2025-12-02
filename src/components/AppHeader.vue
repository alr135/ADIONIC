<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonPopover, IonList, IonItem } from '@ionic/vue'
import { menuOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}

const isCompact = ref(false)
function update() { isCompact.value = window.innerWidth < 1280 }
onMounted(() => {
  update()
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => window.removeEventListener('resize', update))

const popoverOpen = ref(false)
const popoverEvent = ref(null)
function openMenu(ev) {
  popoverEvent.value = ev
  popoverOpen.value = true
}
function nav(path) {
  popoverOpen.value = false
  router.push(path)
}
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <ion-title slot="start">🐴 UMA App</ion-title>

      <!-- Navegación en línea (solo desktop) -->
      <ion-buttons slot="start" class="nav-inline" v-if="!isCompact">
        <ion-button :router-link="'/'">Caballos</ion-button>
        <ion-button :router-link="'/noticias'">Noticias</ion-button>
        <ion-button v-if="authStore.isAdmin" :router-link="'/crear-caballo'">Crear Caballo</ion-button>
        <ion-button v-if="authStore.isAdmin" :router-link="'/crear-noticia'">Crear Noticia</ion-button>
        <ion-button v-if="authStore.isAdmin" :router-link="'/crear-pedigri'">Crear Pedigrí</ion-button>
      </ion-buttons>

      <!-- Botón menú (solo móvil) -->
      <ion-buttons v-if="isCompact" slot="end" class="menu-trigger">
        <ion-button @click="openMenu($event)">
          <ion-icon :icon="menuOutline" />
        </ion-button>
      </ion-buttons>

      <ion-buttons slot="end" v-if="!isCompact" class="nav-inline">
        <ion-button v-if="!authStore.isLoggedIn" :router-link="'/login'">Login</ion-button>
        <ion-button v-else @click="handleLogout">Logout</ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- Popover responsive -->
    <ion-popover
      :is-open="popoverOpen"
      :event="popoverEvent"
      @didDismiss="popoverOpen = false"
      show-backdrop="true"
    >
      <ion-list>
        <ion-item button @click="nav('/')">Caballos</ion-item>
        <ion-item button @click="nav('/noticias')">Noticias</ion-item>
        <ion-item v-if="authStore.isAdmin" button @click="nav('/crear-caballo')">Crear Caballo</ion-item>
        <ion-item v-if="authStore.isAdmin" button @click="nav('/crear-noticia')">Crear Noticia</ion-item>
        <ion-item v-if="authStore.isAdmin" button @click="nav('/crear-pedigri')">Crear Pedigrí</ion-item>
        <ion-item v-if="!authStore.isLoggedIn" button @click="nav('/login')">Login</ion-item>
        <ion-item v-else button @click="handleLogout">Logout</ion-item>
      </ion-list>
    </ion-popover>
  </ion-header>
</template>

<style scoped>
/* Desktop: mostrar botones inline */
.nav-inline { display: flex; gap: 0.25rem; }

/* Móvil: ocultar inline y mostrar trigger */
.menu-trigger { display: flex; padding: 0.5rem;}
@media (min-width: 1280px) {
  .menu-trigger { display: none;  }
}
@media (max-width: 1279px) {
  .nav-inline { display: none; }
}
ion-title { font-size: 1rem; }
</style>