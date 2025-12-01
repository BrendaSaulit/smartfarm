import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import SensorCard from "../components/SensorCard";
import ChartBlock from "../components/ChartBlock";

export default function Sensores() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/sensors");
        const json = await res.json();

        if (json.ok) {
          setData(json.data);
          setHistory(h => [
            ...h.slice(-59),
            { t: Date.now(), value: json.data.temperature }
          ]);
        }
      } catch {}
    };

    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <NavBar />
      <div className="container">
        <h1>Sensores</h1>

        {data && (
          <>
            <SensorCard title="Temperatura" value={data.temperature} unit="°C" status="online" />
            <SensorCard title="Umidade do Solo" value={data.soil} unit="%" status="online" />
            <SensorCard title="Luminosidade" value={data.light} unit="lx" status="online" />

            <ChartBlock label="Temperatura" history={history} />
          </>
        )}
      </div>
    </>
  );
}