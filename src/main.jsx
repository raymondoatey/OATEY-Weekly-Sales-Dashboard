import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MISPortal from './MIS_Input_Portal.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MISPortal />
  </StrictMode>,
)
