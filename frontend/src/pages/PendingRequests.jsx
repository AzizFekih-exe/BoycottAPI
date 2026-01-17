import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function PendingRequests() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPendingProofs();
  }, []);

  const fetchPendingProofs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/proofs/pending`);
      setProofs(response.data);
    } catch (error) {
      console.error("Failed to fetch pending proofs:", error);
      setMessage("Failed to load pending proofs");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proofId, weight) => {
    try {
      await axios.patch(`${API_URL}/proofs/${proofId}/approve`, {
        status: "APPROVED",
        weight: parseInt(weight),
      });
      setMessage("Proof approved successfully!");
      fetchPendingProofs();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to approve proof");
    }
  };

  const handleReject = async (proofId) => {
    try {
      await axios.patch(`${API_URL}/proofs/${proofId}/approve`, {
        status: "REJECTED",
      });
      setMessage("Proof rejected successfully!");
      fetchPendingProofs();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reject proof");
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pending Requests</h1>
        <Button onClick={fetchPendingProofs} variant="outline">
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes("success") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
          {message}
        </div>
      )}

      {proofs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending proofs to review
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proofs.map((proof) => (
            <ProofCard
              key={proof.id}
              proof={proof}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
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
