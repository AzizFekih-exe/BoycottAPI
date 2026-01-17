import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { FileText } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function SubmitProof() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    company_id: "",
    product_id: "",
    description: "",
    source_url: "",
    weight: 50,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (formData.company_id) {
      fetchProducts(formData.company_id);
    }
  }, [formData.company_id]);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies/`);
      setCompanies(response.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchProducts = async (companyId) => {
    try {
      const response = await axios.get(`${API_URL}/products/`);
      const filtered = response.data.filter(p => p.company_id === parseInt(companyId));
      setProducts(filtered);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      
      const payload = {
        company_id: parseInt(formData.company_id),
        description: formData.description,
        source_url: formData.source_url,
        weight: parseInt(formData.weight),
      };

      if (formData.product_id) {
        payload.product_id = parseInt(formData.product_id);
      }
      
      await axios.post(`${API_URL}/proofs/`, payload);
      
      setMessage("Proof submitted successfully! It will be reviewed by moderators.");
      setFormData({ company_id: "", product_id: "", description: "", source_url: "", weight: 50 });
      
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Submit Proof</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proof Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Company *</label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value, product_id: "" })}
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

            <div>
              <label className="text-sm font-semibold mb-2 block">Product (Optional)</label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                disabled={!formData.company_id}
              >
                <option value="">Select a product (optional)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty if the proof applies to the company in general
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Description *</label>
              <textarea
                className="w-full px-3 py-2 border border-input bg-background rounded-md min-h-[100px]"
                placeholder="Describe the evidence for boycotting this company/product..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Source URL *</label>
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">
                Weight (1-100) - Default: 50
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher weight = stronger evidence
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded ${message.includes("success") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Proof"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
