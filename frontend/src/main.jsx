import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import { store } from './store/index.js'
import { SocketProvider } from './context/SocketContext.jsx'
import './index.css'
import App from './App.jsx'
import { installZoomGuards } from './lib/viewportLock.js'

installZoomGuards()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </HelmetProvider>
    </Provider>
  </StrictMode>,
)

