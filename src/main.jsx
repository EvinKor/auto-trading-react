import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TestNotification from './TestNotification.jsx'

const path = window.location.pathname
const isTest = path.startsWith('/test-notification')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isTest ? <TestNotification /> : <App />}
  </StrictMode>,
)
