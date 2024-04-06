import React, { useEffect } from 'react'
import WhiteBoard from './WhiteBoard'
import {Routes, Route} from 'react-router-dom'
import Dashboard from './Dashboard'
import { useSelector } from 'react-redux';
import { setBoardId } from './store/baordSlice';
const App = () => {
const boardId = useSelector((state) => state.board.id);
const id = localStorage.getItem('boardId');


  useEffect(() => {
    setBoardId(boardId);
  }, [useSelector, id]); // Access boardId


   return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/board/:id" element={<WhiteBoard />} />
      </Routes>
    </div>
  )
}

export default App