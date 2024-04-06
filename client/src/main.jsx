import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './context/UserContext.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <Provider store={store}>
    <UserProvider>
      <App />
    </UserProvider>
    </Provider>
    </BrowserRouter>
  </React.StrictMode>,
)




