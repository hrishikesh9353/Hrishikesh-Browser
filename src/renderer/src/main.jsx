import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StandaloneHome from './StandaloneHome'

const root = createRoot(document.getElementById('root'))

if (window.api) {
  import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
} else {
  root.render(
    <StrictMode>
      <StandaloneHome />
    </StrictMode>
  )
}
