/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { registerServiceWorker } from './serviceWorkerRegistration'

// Registra o Service Worker do PWA para cache do shell e abertura standalone
registerServiceWorker({
  onUpdate: (registration) => {
    // Se houver nova versão, manda o SW assumir imediatamente
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  },
})

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
