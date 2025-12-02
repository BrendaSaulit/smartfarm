import "../styles/global.css";
import { AuthProvider } from "../contexts/AuthContext";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Páginas que NÃO devem mostrar a NavBar
  const noNavbarPages = ['/login', '/signup'];
  const showNavbar = !noNavbarPages.includes(router.pathname);

  return (
    <AuthProvider>
      {showNavbar && <NavBar />}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;