import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    } else if (roles.length > 0 && (!user || !roles.includes(user.role))) {
      // se não tem role necessária
      router.replace("/");
    }
  }, [token, user]);

  if (!token) return null;
  if (roles.length > 0 && (!user || !roles.includes(user.role))) return null;

  return children;
}