import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SiteProvider } from './site'
import '@fontsource-variable/geist'
import '@fontsource-variable/noto-sans-sc'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <BrowserRouter><SiteProvider><App /></SiteProvider></BrowserRouter>,
)
