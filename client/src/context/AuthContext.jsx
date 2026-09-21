import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('parkingAuth')) || null;
  } catch {
    localStorage.removeItem('parkingAuth');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = (data) => {
    const nextAuth = { token: data.token, user: data.user };
    localStorage.setItem('parkingAuth', JSON.stringify(nextAuth));
    setAuth(nextAuth);
  };

  const logout = () => {
    localStorage.removeItem('parkingAuth');
    setAuth(null);
  };

  const updateUser = (user) => {
    setAuth((current) => {
      const nextAuth = { ...current, user };
      localStorage.setItem('parkingAuth', JSON.stringify(nextAuth));
      return nextAuth;
    });
  };

  return <AuthContext.Provider value={{ auth, user: auth?.user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
