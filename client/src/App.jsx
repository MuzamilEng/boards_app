import React from 'react'
import  { Suspense, lazy } from 'react';
import {Routes, Route} from 'react-router-dom'
import Dashboard from './Dashboard'
const LazyWhiteBoard = lazy(() => import('./WhiteBoard'));

const App = () => {
   return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/board/:id" element={<Suspense fallback={<div>Loading...</div>}><LazyWhiteBoard /></Suspense>} />
      </Routes>
    </div>
  )
}

export default App