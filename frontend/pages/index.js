import NavBar from "../components/NavBar";

export default function Home() {
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>SmartFarm — Painel IoT</h1>
        <p>Bem-vindo ao sistema de fazenda inteligente.</p>
      </div>
    </>
  );
}