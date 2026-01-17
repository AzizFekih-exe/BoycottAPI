import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Building2 } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function SubmitCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      
      await axios.post(`${API_URL}/companies/`, formData);
      
      setMessage("Company submitted successfully!");
      setFormData({ name: "", country: "" });
      
      setTimeout(() => navigate("/companies"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Submit New Company</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Company Name *</label>
              <Input
                type="text"
                placeholder="e.g., Coca-Cola Company"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Country *</label>
              <Input
                type="text"
                placeholder="e.g., United States"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded ${message.includes("success") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Company"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/companies")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
