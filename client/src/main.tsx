import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el contenedor #root')

// Sin StrictMode: el grafo de Web Audio se construye una sola vez por elemento <audio>.
createRoot(container).render(<App />)
