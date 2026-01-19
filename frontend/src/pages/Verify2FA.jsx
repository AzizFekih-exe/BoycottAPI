import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Shield } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function Verify2FA() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const tempToken = searchParams.get("temp_token");
  // We don't login yet, so we use axios directly with the temp token as bearer?
  // The backend endpoint /auth/2fa/verify uses @jwt_required().
  // So we must send the temp token in the Authorization header.

  useEffect(() => {
    if (!tempToken) {
      navigate("/login");
    }
  }, [tempToken, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");

      const response = await axios.post(
        `${API_URL}/auth/2fa/verify`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`
          }
        }
      );

      // Verify successful - Response contains full access token and user info
      const { access_token, user_id, role, email, display_name } = response.data;
      
      const userData = {
        id: user_id,
        role: role,
        email: email,
        display_name: display_name
      };
      
      login(access_token, userData);
      navigate("/");
      
    } catch (error) {
        console.error("2FA Verify error:", error);
      setMessage(error.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please enter the verification code from your authenticator app to continue.
          </p>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                required
                autoFocus
              />
            </div>
            
            {message && (
              <div className="p-3 bg-red-500/10 text-red-500 rounded text-sm text-center">
                {message}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
