import NavBar from "../components/NavBar";
import KPIBox from "../components/KPIBox";

export default function Indicadores() {
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>Indicadores</h1>

        <KPIBox title="Média Diária de Umidade" value={45} unit="%" />
        <KPIBox title="Horas de Irrigação" value={1.5} unit="h" />
      </div>
    </>
  );
}