// context/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username: string, password: string) => {
    // Aquí podrías validar con tu API, de momento simulemos:
    setUser({ name: username });  // ✅ IMPORTANTE
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
