import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function PendingRequests() {
  const [proofs, setProofs] = useState([]);
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState("proofs");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllPending();
  }, []);

  const fetchAllPending = async () => {
    try {
      setLoading(true);
      const [proofsRes, productsRes, companiesRes] = await Promise.all([
        axios.get(`${API_URL}/proofs/pending`),
        axios.get(`${API_URL}/products/pending`),
        axios.get(`${API_URL}/companies/pending`),
      ]);
      setProofs(proofsRes.data);
      setProducts(productsRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      setMessage("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (proofId, weight) => {
    try {
      await axios.patch(`${API_URL}/proofs/${proofId}/approve`, {
        status: "APPROVED",
        weight: parseInt(weight),
      });
      setMessage("Proof approved successfully!");
      fetchAllPending();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to approve proof");
    }
  };

  const handleRejectProof = async (proofId) => {
    try {
      await axios.patch(`${API_URL}/proofs/${proofId}/approve`, {
        status: "REJECTED",
      });
      setMessage("Proof rejected successfully!");
      fetchAllPending();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reject proof");
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      await axios.patch(`${API_URL}/products/${productId}/approve`);
      setMessage("Product approved successfully!");
      fetchAllPending();
    } catch (error) {
      setMessage("Failed to approve product");
    }
  };

  const handleRejectProduct = async (productId) => {
    try {
      await axios.delete(`${API_URL}/products/${productId}/approve`);
      setMessage("Product rejected successfully!");
      fetchAllPending();
    } catch (error) {
      setMessage("Failed to reject product");
    }
  };

  const handleApproveCompany = async (companyId) => {
    try {
      await axios.patch(`${API_URL}/companies/${companyId}/approve`);
      setMessage("Company approved successfully!");
      fetchAllPending();
    } catch (error) {
      setMessage("Failed to approve company");
    }
  };

  const handleRejectCompany = async (companyId) => {
    try {
      await axios.delete(`${API_URL}/companies/${companyId}/approve`);
      setMessage("Company rejected successfully!");
      fetchAllPending();
    } catch (error) {
      setMessage("Failed to reject company");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold italic tracking-tighter">Pending Requests</h1>
        <Button onClick={fetchAllPending} variant="outline" className="gap-2">
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg w-fit">
        {[
          { id: "proofs", label: "Proofs", count: proofs.length },
          { id: "products", label: "Products", count: products.length },
          { id: "companies", label: "Companies", count: companies.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-3 rounded-lg border animate-in fade-in slide-in-from-top-2 ${
          message.includes("success") 
            ? "bg-green-500/10 border-green-500/20 text-green-500" 
            : "bg-red-500/10 border-red-500/20 text-red-500"
        }`}>
          {message}
        </div>
      )}

      {activeTab === "proofs" && (
        <div className="space-y-4">
          {proofs.length === 0 ? (
            <EmptyState message="No pending proofs" />
          ) : (
            proofs.map((proof) => (
              <ProofCard
                key={proof.id}
                proof={proof}
                onApprove={handleApproveProof}
                onReject={handleRejectProof}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <EmptyState message="No pending products" />
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onApprove={handleApproveProduct}
                onReject={handleRejectProduct}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "companies" && (
        <div className="space-y-4">
          {companies.length === 0 ? (
            <EmptyState message="No pending companies" />
          ) : (
            companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onApprove={handleApproveCompany}
                onReject={handleRejectCompany}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-muted-foreground italic">
        {message}
      </CardContent>
    </Card>
  );
}

function ProductCard({ product, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    await action(product.id);
    setLoading(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          New Product: {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Serial Number</label>
            <p className="font-mono">{product.serial_number}</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
            <p>{product.category}</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Company ID</label>
            <p>#{product.company_id}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button onClick={() => handleAction(onApprove)} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" /> Approve
          </Button>
          <Button onClick={() => handleAction(onReject)} disabled={loading} variant="destructive">
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyCard({ company, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    await action(company.id);
    setLoading(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          New Company: {company.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
            <p>{company.country || "N/A"}</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Website</label>
            <p className="truncate">{company.website || "N/A"}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button onClick={() => handleAction(onApprove)} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" /> Approve
          </Button>
          <Button onClick={() => handleAction(onReject)} disabled={loading} variant="destructive">
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProofCard({ proof, onApprove, onReject }) {
  const [weight, setWeight] = useState(proof.weight || 50);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(proof.id, weight);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(proof.id);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Proof #{proof.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Company ID</label>
            <p>{proof.company_id}</p>
          </div>
          {proof.product_id && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Product ID</label>
              <p>{proof.product_id}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Submitted By</label>
            <p>User #{proof.created_by}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-1 block">Description</label>
          <p className="text-foreground">{proof.description}</p>
        </div>

        {proof.source_url && (
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">Source</label>
            <a
              href={proof.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {proof.source_url}
            </a>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">
              Weight (1-100)
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
