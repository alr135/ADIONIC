<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

/**
 * Componente: LoginForm
 *  - ¿Qué hace?: Proporciona un formulario de inicio de sesión para que los usuarios
 *    puedan autenticarse en la aplicación. Gestiona la entrada del usuario y maneja
 *    el proceso de autenticación mediante el store de autenticación.
 * - Eventos procesados/generados: Maneja el evento de envío del formulario para
 *   iniciar sesión. No emite eventos personalizados.
 * Estado: Local (ref):
 *  - email: Almacena el email ingresado por el usuario.
 *  - password: Almacena la contraseña ingresada por el usuario.
 *  - shake: Controla la animación de temblor en caso de error de autenticación.
 * Estados: Distribuido (AuthStore):
 *  - authStore: Store de autenticación que maneja el estado de login, logout,
 *    errores y carga.
 *      
 *    Propiedades disponibles en la store:
 *    + user: Información del usuario autenticado.
 *    + isLoggedIn: Indica si el usuario está loggeado o no
 *    + error: Mensaje de error de autenticación, si existe
 *    + loading: Indica si una operación de autenticación está en curso
 *    + userEmail: Email del usuario autenticado
 *    + userName: Nombre del usuario autenticado
 *    + userRole: Rol del usuario autenticado
 *    + isAdmin: Incica si el usuario actual es administrador o no
 * 
 *    Métodos disponibles en la store:
 *    + initAuth: Inicializa desde PocketBase al store
 *    + login: Llama al userSevice para autenticar si el usuario
 *    existe y en caso de correcto inciar sesión
 *    + logout: Cierra la sesión activa
 *    + clearError: Borra el error actual que esté almacenado en la authStore
 * 
 * Notas de diseño:
 *  - Se han usado para layout y estilos varias clases de Bootstrap (card, row,
 *    col, form-control).
 *  - El formulario es un componente controlado, por lo que todos los campos están
 *    vinculados a un estado local reactivo.
 *  - Usamos <Transition> y <TransitionGroup> para animar la carga de la tarjeta de
 *    Bootstrap en la que se encuentra el formulario.  
 */

const router = useRouter();
const email = ref('');
const password = ref('');
const authStore = useAuthStore();

const shake = ref(false)
const formRef = ref(null)

// activar temblor cuando hay error en el store
watch(() => authStore.error, (val) => {
  if (val) {
    shake.value = true
    // duración del efecto (ligeramente mayor que la animación)
    setTimeout(() => { shake.value = false }, 600)
  }
})

async function handleLogin() {
  authStore.clearError();
  try {
    await authStore.login(email.value, password.value);
    await router.push('/caballos');
  } catch (error) {
    // activar el temblor inmediatamente también para respuesta instantánea
    shake.value = true
    setTimeout(() => { shake.value = false }, 600)
    console.error('Error durante el inicio de sesión:', error);
  } 
};

function onFormSubmit(e) {
  // si el navegador detecta campos inválidos, el evento submit no se dispara;
  // aquí comprobamos manualmente la validez para forzar la animación y mostrar mensajes.
  if (formRef.value) {
    if (!formRef.value.checkValidity()) {
      formRef.value.reportValidity()
      shake.value = true
      setTimeout(() => { shake.value = false }, 600)
      return
    }
  }
  // campos válidos -> intentar login
  handleLogin()
}

</script>

<template>
  <Transition name="content" mode="out-in" appear>
    <div class="login-page">
      <div class="login-card card shadow-sm p-4">
        <h2 class="h5 mb-3 text-center">Login</h2>
        <div key="login-form-content">
          <form ref="formRef" @submit.prevent="onFormSubmit" :class="{ shake }" novalidate>
            <div class="mb-3">
              <label for="email" class="form-label label-login">Email</label>
              <input class="form-control input" type="email" id="email" v-model="email" required />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label label-login">Password</label>
              <input class="form-control input" type="password" id="password" v-model="password" required />
            </div>
            <button type="submit" class="btn btn-success w-100 submit-btn" :disabled="authStore.loading">
              <span v-if="!authStore.loading">Acceder</span>
              <span v-else>Cargando…</span>
            </button>
            <div v-if="authStore.error" class="error mt-2">{{ authStore.error }}</div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Layout centrado de la página */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: calc(100vh - 4rem);
  box-sizing: border-box;
  background: transparent;
}

/* Transitions for form mount/unmount */
.content-enter-active, .content-leave-active, .content-appear-active { transition: all 0.4s ease; }
.content-enter-from, .content-appear-from { opacity: 0; transform: translateY(20px); }
.content-leave-to { opacity: 0; transform: translateY(-20px); }

/* Tarjeta del formulario */
.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-background, #ffffff);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 8px 24px rgba(16,24,40,0.06);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Título */
.login-card h2 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  color: var(--color-heading, #2c3e50);
  text-align: center;
}

/* Formulario y campos */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid #e6e9ee;
  border-radius: 8px;
  font-size: 0.98rem;
  background: transparent;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  color: var(--color-text, #222);
}

.input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 4px 12px rgba(66,184,131,0.08);
}

/* Botón principal */
.submit-btn {
  margin-top: 1rem;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #42b883, #2d9a63);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.65; cursor: not-allowed; }

/* Shake animation on error */
.shake .input,
.shake .submit-btn {
  animation: shake 0.48s cubic-bezier(.36,.07,.19,.97);
}

@keyframes shake {
  0% { transform: translateX(0); }
  10% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  50% { transform: translateX(-6px); }
  70% { transform: translateX(6px); }
  90% { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}

/* Mensaje de error */
.error {
  margin-top: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: #fff3f3;
  color: #9b1c1c;
  border: 1px solid #ffd6d6;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

/* Estilos para las etiquetas de formulario */
.label-login {
  font-weight: 600;
  color: var(--color-text, #222);
  margin-right: 0.5rem;
  margin-bottom: 1rem;
}

/* Responsividad */
@media (max-width: 480px) {
  .login-card { padding: 1rem; border-radius: 10px; }
  .input { padding: 0.66rem 0.75rem; }
  .btn { padding: 0.66rem; }
}

/* Dark scheme fallback */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(20, 24, 28, 0.6);
    border: 1px solid rgba(255,255,255,0.04);
    box-shadow: none;
  }
  .input {
    border: 1px solid rgba(255,255,255,0.06);
    color: var(--color-text, #eee);
    background: rgba(255,255,255,0.02);
  }
  .btn { background: linear-gradient(180deg,#3fbf97,#2b8e68); }
  .error { background: rgba(255, 50, 50, 0.06); color: #ffc6c6; border: 1px solid rgba(255,50,50,0.12); }
}
</style>