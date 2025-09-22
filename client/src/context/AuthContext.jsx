// client/src/context/AuthContext.jsx
import React,
{
  createContext,
  useState,
  useContext
} from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({
  children
}) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value = {
    value
  } > {
    children
  } </AuthContext.Provider>;
};