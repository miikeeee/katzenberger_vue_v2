import { createApp } from 'vue'
import { createPinia } from 'pinia' // Import Pinia
import App from './App.vue'
import './style.css' // Standard Vite CSS Import
// Importiere Bulma (oder dein gewähltes Framework)
import 'bulma/css/bulma.css'

const app = createApp(App)
const pinia = createPinia() // Erstelle Pinia Instanz

app.use(pinia) // Verwende Pinia mit der App
app.mount('#app')