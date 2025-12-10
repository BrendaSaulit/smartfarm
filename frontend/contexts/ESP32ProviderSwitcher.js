// frontend/contexts/ESP32ProviderSwitcher.js
import { useState, useEffect } from 'react';
import ESP32Provider from './ESP32Provider';

export default function ESP32ProviderSwitcher({ children }) {
  const [useMock, setUseMock] = useState(false);
  const [currentIP, setCurrentIP] = useState("http://10.106.33.1");

  // Detecta automaticamente no desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Tenta conectar ao mock primeiro
      fetch("http://localhost:3002/dev/state")
        .then(() => {
          console.log("✅ Mock ESP32 detectado, usando localhost:3002");
          setCurrentIP("http://localhost:3002");
          setUseMock(true);
        })
        .catch(() => {
          console.log("ℹ️ Mock não encontrado, usando ESP32 real");
          setCurrentIP("http://10.106.33.1");
          setUseMock(false);
        });
    }
  }, []);

  // Sobrescreve a constante ESP32_IP
  const CustomESP32Provider = ({ children }) => {
    const [ip, setIp] = useState(currentIP);

    return (
      <ESP32Provider customIP={ip}>
        {children}
        {/* Controles DEV apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: '#1a1a1a',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #333',
            fontSize: '12px',
            zIndex: 9999
          }}>
            <div>🔌 ESP32 Mode: <strong>{useMock ? 'MOCK' : 'REAL'}</strong></div>
            <div>📍 IP: {currentIP}</div>
            <button 
              onClick={() => {
                const newIP = useMock ? "http://10.106.33.1" : "http://localhost:3002";
                setCurrentIP(newIP);
                setUseMock(!useMock);
                window.location.reload();
              }}
              style={{
                marginTop: '5px',
                padding: '5px 10px',
                background: useMock ? '#10b981' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Switch to {useMock ? 'REAL' : 'MOCK'}
            </button>
          </div>
        )}
      </ESP32Provider>
    );
  };

  return <CustomESP32Provider>{children}</CustomESP32Provider>;
}