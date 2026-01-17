import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Chrome } from "lucide-react";

export default function Authentication() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google login endpoint.
    // Assuming backend is running on localhost:5000 based on standard Flask apps
    // I should check where the backend is running.
    // The user's docker compose shows "ports: 5000:5000" for the api service?
    // Let's assume http://localhost:5000 for now.
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
