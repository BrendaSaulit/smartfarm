import NavBar from "../components/NavBar";
import ActuatorControl from "../components/ActuatorControl";

export default function Atuadores() {
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>Atuadores</h1>

        <ActuatorControl name="Iluminação" command="LED" />
        <ActuatorControl name="Irrigação" command="WATER" />
      </div>
    </>
  );
}