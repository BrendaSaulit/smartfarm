import { useState } from "react";
import { useAuth } from "../src/contexts/AuthContext";

export default function ActuatorControl({ name, command }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function sendCmd(value) {
    if (!token) { setMsg("Faça login para enviar comandos"); return; }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/actuator", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cmd: command, value, user: user?.user || 'anon' })
      });
      const json = await res.json();
      if (json.ok) setMsg("Comando enviado com sucesso");
      else setMsg("Falha: " + (json.error || JSON.stringify(json)));
    } catch (e) {
      setMsg("Erro de comunicação: " + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="card">
      <h3>{name}</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => sendCmd("ON")} disabled={loading}>Ligar</button>
        <button onClick={() => sendCmd("OFF")} disabled={loading}>Desligar</button>
      </div>
      {loading && <p>Enviando...</p>}
      {msg && <p>{msg}</p>}
    </div>
  );
}