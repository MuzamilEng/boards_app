import React, { createContext, useContext, useState } from 'react';

export const UserContext = createContext(); // Export UserContext

export const useGlobalContext = () => useContext(UserContext);

export const UserProvider = ({ children }) => {

  const [boardId, setBoardId] = useState(null);

  const handleBoardClick = (newBoardId) => {
    setBoardId(newBoardId);
  };

  return (
    <UserContext.Provider value={{ boardId, setBoardId, handleBoardClick }}>
      {children}
    </UserContext.Provider>
  );
};
