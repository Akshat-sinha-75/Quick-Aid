import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('quickaid_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
    setUser(data);
    localStorage.setItem('quickaid_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    setUser(data);
    localStorage.setItem('quickaid_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const updateProfile = async (name, email, password) => {
    const { data } = await axios.put(`${API_URL}/auth/profile`, { name, email, password });
    setUser(data);
    localStorage.setItem('quickaid_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quickaid_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
