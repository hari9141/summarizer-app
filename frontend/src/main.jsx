import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'  // Import AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap App with AuthProvider - IMPORTANT! */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
