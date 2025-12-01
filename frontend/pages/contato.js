import NavBar from "../components/NavBar";

export default function Contato() {
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>Contato</h1>
        <p>Email: seuemail@example.com</p>

        <a href="/cv.pdf" download>
          <button>Baixar CV</button>
        </a>
      </div>
    </>
  );
}