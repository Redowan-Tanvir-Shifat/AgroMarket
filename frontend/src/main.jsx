import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { API_BASE_URL } from './config/api'
import './index.css'
import App from './App.jsx'

// Set default baseURL for axios in production or when VITE_API_URL is configured
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

