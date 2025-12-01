import Link from "next/link";
import { useAuth } from "../src/contexts/AuthContext";
import { useRouter } from "next/router";

export default function NavBar() {
  const { token, user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav style={{
      display: "flex",
      gap: "20px",
      padding: "20px",
      background: "#2a5d2a",
      color: "white",
      alignItems: "center"
    }}>
      <Link href="/">Home</Link>
      <Link href="/sensores">Sensores</Link>
      <Link href="/atuadores">Atuadores</Link>
      <Link href="/indicadores">Indicadores</Link>
      <Link href="/contato">Contato</Link>

      <div style={{ marginLeft: "auto", display: "flex", gap: "10px", alignItems: "center" }}>
        {token ? (
          <>
            <span>{user?.user} ({user?.role})</span>
            <button onClick={handleLogout} style={{ padding: "6px 10px" }}>Logout</button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}