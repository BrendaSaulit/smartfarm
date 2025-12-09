import "../styles/global.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ESP32Provider } from "../contexts";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  
  // Páginas que NÃO devem mostrar a NavBar
  const noNavbarPages = ['/login', '/signup'];
  const showNavbar = !noNavbarPages.includes(router.pathname);

  // Captura erros globais
  useEffect(() => {
    const handleError = (error) => {
      console.error('Erro global:', error);
      setError(error.message);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <AuthProvider>
      <ESP32Provider>
        {error && (
          <div style={{
            background: '#f44336',
            color: 'white',
            padding: '10px',
            textAlign: 'center'
          }}>
            Erro: {error}
          </div>
        )}
        {showNavbar && <NavBar />}
        <Component {...pageProps} />
      </ESP32Provider>
    </AuthProvider>
  );
}

export default MyApp;