import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Package } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function SubmitProduct() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    serial_number: "",
    category: "",
    company_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies/`);
      setCompanies(response.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      
      await axios.post(`${API_URL}/products/`, {
        ...formData,
        company_id: parseInt(formData.company_id),
      });
      
      setMessage("Product submitted successfully! It will be reviewed by moderators.");
      setFormData({ name: "", serial_number: "", category: "", company_id: "" });
      
      setTimeout(() => navigate("/products"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Submit New Product</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Product Name *</label>
              <Input
                type="text"
                placeholder="e.g., Coca-Cola Classic"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Serial Number / Barcode *</label>
              <Input
                type="text"
                placeholder="e.g., 0049000042566"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Category *</label>
              <Input
                type="text"
                placeholder="e.g., beverages, food, electronics"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Company *</label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div className={`p-3 rounded ${message.includes("success") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
