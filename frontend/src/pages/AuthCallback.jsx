import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get("access_token");
    const userId = searchParams.get("user_id");
    const role = searchParams.get("role");
    
    // Minimal error handling
    if (!accessToken) {
        console.error("No access token provided");
        navigate("/login");
        return;
    }

    const userData = { id: userId, role: role };
    login(accessToken, userData);
    
    // Redirect to home
    navigate("/");
  }, [searchParams, login, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Logging in...</span>
    </div>
  );
}
