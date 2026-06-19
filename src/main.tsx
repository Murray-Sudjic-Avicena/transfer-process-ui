import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import './index.css'
import App from './App.tsx'

ModuleRegistry.registerModules([AllCommunityModule]) // Sets up the data grid

createRoot(document.getElementById('root')!).render( // Tells react where to render. In index.html
  <StrictMode>
    <App />
  </StrictMode>,
)
