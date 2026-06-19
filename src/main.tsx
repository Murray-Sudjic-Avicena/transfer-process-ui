import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render( // Tells react where to render. In index.html
  <StrictMode>
    <App />
  </StrictMode>,
)
