import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Shield, User, Mail, Award, CheckCircle } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function Profile() {
  const { user, login, token } = useAuth();
  
  // existing state ...
  const [qrCode, setQrCode] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    // Fetch user profile to check 2FA status
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setIs2FAEnabled(response.data.is_2fa_enabled);
      // Update auth context with fresh user data
      if (token) {
        login(token, response.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await axios.post(`${API_URL}/auth/2fa/setup`);
      setQrCode(response.data.qrcode_base64);
      setMessage("Scan the QR code with your authenticator app, then enter the code below.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      await axios.post(`${API_URL}/auth/2fa/verify`, {
        code: verificationCode,
      });
      setMessage("2FA enabled successfully!");
      setIs2FAEnabled(true);
      setQrCode(null);
      setVerificationCode("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "MODERATOR":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "CONTRIBUTOR":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Profile</h1>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name
              </label>
              <p className="text-foreground">{user?.display_name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Role
              </label>
              <div className={`inline-block px-3 py-1 rounded text-sm font-bold border ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">2FA is enabled</span>
            </div>
          ) : (
            <>
              {!qrCode ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Enhance your account security by enabling two-factor authentication.
                  </p>
                  <Button onClick={handleSetup2FA} disabled={loading}>
                    {loading ? "Setting up..." : "Enable 2FA"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="2FA QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Enter verification code from your authenticator app:
                      </label>
                      <Input
                        type="text"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Verifying..." : "Verify and Enable"}
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}

          {message && (
            <div className={`p-3 rounded ${message.includes("success") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
