import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SiteProvider } from './site'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <BrowserRouter><SiteProvider><App /></SiteProvider></BrowserRouter>,
)
