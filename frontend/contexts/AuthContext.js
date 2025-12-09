// frontend/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();

  // Carregar token e usuário do localStorage na inicialização
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const savedToken = localStorage.getItem('sf_token');
        const savedUser = localStorage.getItem('sf_user');
        
        if (savedToken && savedUser) {
          // Verificar se o token ainda é válido
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: savedToken })
          });
          
          const data = await response.json();
          
          if (data.valid) {
            setToken(savedToken);
            setUser(data.user);
          } else {
            // Token inválido - limpar localStorage
            localStorage.removeItem('sf_token');
            localStorage.removeItem('sf_user');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuthData();
  }, []);

  // Login com backend
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Salvar token e usuário
        localStorage.setItem('sf_token', data.token);
        localStorage.setItem('sf_user', JSON.stringify(data.user));
        
        setToken(data.token);
        setUser(data.user);
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: 'Erro de conexão com o servidor' 
      };
    }
  };

  // Cadastro com backend
  const signup = async (username, name, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Auto-login após cadastro
        localStorage.setItem('sf_token', data.token);
        localStorage.setItem('sf_user', JSON.stringify(data.user));
        
        setToken(data.token);
        setUser(data.user);
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { 
        success: false, 
        error: 'Erro de conexão com o servidor' 
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  // Verificar autenticação para rotas protegidas
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const contextValue = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}