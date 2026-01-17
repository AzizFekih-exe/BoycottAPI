import { useState } from "react";
import axios from "axios";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Loader2, Search, CheckCircle, XCircle, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:8000";

export default function ScanPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!serialNumber) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/products/scan`, {
        serial_number: serialNumber
      });
      setResult(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
          setError("Product not found. Please check the barcode and try again.");
      } else {
          setError("An error occurred while scanning. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Scan Product</h1>
        <p className="text-muted-foreground">Enter the barcode/serial number to check boycott status.</p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="flex gap-4">
            <Input
              placeholder="Enter Barcode (e.g. 12345678)"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="text-lg h-12 font-mono"
            />
            <Button type="submit" size="lg" disabled={loading} className="h-12 w-32">
              {loading ? <Loader2 className="animate-spin" /> : "Scan"}
            </Button>
          </form> 
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-center font-medium">
            {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ScanResultView data={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScanResultView({ data }) {
    const { product, company, key_proofs, local_alternatives, external_alternatives } = data;
    const isBoycott = product.boycott_status === "BOYCOTT";
    
    return (
        <div className="space-y-6">
            <Card className={`border-l-8 ${isBoycott ? "border-l-red-500" : "border-l-green-500"}`}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {isBoycott ? (
                            <XCircle className="h-8 w-8 text-red-500" />
                        ) : (
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        )}
                        <div>
                            <CardTitle className="text-2xl">{product.name}</CardTitle>
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${isBoycott ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                {product.boycott_status}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <span className="text-muted-foreground text-sm">Manufacturer</span>
                        <p className="font-semibold text-lg">{company.name}</p>
                    </div>
                    {product.description && (
                         <div>
                            <span className="text-muted-foreground text-sm">Description</span>
                            <p>{product.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isBoycott && (
                <>
                {key_proofs && key_proofs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Why is this boycotted?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {key_proofs.map(proof => (
                                    <li key={proof.id} className="text-sm border-l-2 pl-3 border-muted">
                                        <p className="font-medium">{proof.title}</p>
                                        <a href={proof.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 mt-1 text-xs">
                                            View Source <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {(local_alternatives.length > 0 || external_alternatives.length > 0) && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Alternatives</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {local_alternatives.map(alt => (
                                <AlternativeCard key={alt.id} product={alt} type="Local" />
                            ))}
                            {external_alternatives.map(alt => (
                                <AlternativeCard key={alt.id} product={alt} type="Global" />
                            ))}
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    )
}

function AlternativeCard({ product, type }) {
    return (
        <Card className="bg-card/50 hover:bg-card transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <h4 className="font-bold">{product.name}</h4>
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 rounded-full">{type}</span>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500 opacity-50" />
            </CardContent>
        </Card>
    )
}
