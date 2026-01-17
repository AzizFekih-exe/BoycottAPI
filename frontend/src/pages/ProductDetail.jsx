import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [companyProofs, setCompanyProofs] = useState([]);
  const [alternatives, setAlternatives] = useState({ local: [], external: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      
      // Fetch product with company info
      const productResponse = await axios.get(`${API_URL}/products/${id}`);
      const productData = productResponse.data;
      setProduct(productData);

      // Fetch company proofs if company exists
      if (productData.company?.id) {
        try {
          const companyResponse = await axios.get(`${API_URL}/companies/${productData.company.id}`);
          // Filter for approved proofs only
          const approvedProofs = (companyResponse.data.proofs || [])
            .filter(proof => proof.status === 'APPROVED')
            .slice(0, 5); // Limit to top 5
          setCompanyProofs(approvedProofs);
        } catch (err) {
          console.error("Failed to fetch company proofs:", err);
        }
      }

      // Fetch alternatives if product is boycotted
      if (productData.boycott_status === 'BOYCOTT') {
        try {
          const altResponse = await axios.get(`${API_URL}/products/${id}/alternatives`);
          setAlternatives({
            local: altResponse.data.local_alternatives || [],
            external: altResponse.data.external_alternatives || []
          });
        } catch (err) {
          console.error("Failed to fetch alternatives:", err);
          // Alternatives endpoint might not exist, that's okay
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "BOYCOTT":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "SAFE":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error || "Product not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/products")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-3xl">{product.name}</CardTitle>
            <div className={`px-3 py-1 rounded text-sm font-bold border ${getStatusColor(product.boycott_status)}`}>
              {product.boycott_status}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">
              {product.description || "No description available."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Serial Number</h4>
              <p className="font-mono bg-muted px-2 py-1 rounded inline-block">{product.serial_number}</p>
            </div>
            
            {product.category && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Category</h4>
                <p className="capitalize">{product.category}</p>
              </div>
            )}

            {product.company_name && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Company</h4>
                <p>{product.company_name}</p>
              </div>
            )}

            {product.country_of_origin && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Country of Origin</h4>
                <p>{product.country_of_origin}</p>
              </div>
            )}
          </div>

          {companyProofs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Evidence & Proofs</h3>
              <div className="space-y-2">
                {companyProofs.map((proof) => (
                  <div key={proof.id} className="border rounded-lg p-3 bg-muted/30">
                    <p className="text-sm mb-2">{proof.description}</p>
                    {proof.source_url && (
                      <a 
                        href={proof.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(alternatives.local.length > 0 || alternatives.external.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Alternatives</h3>
              
              {alternatives.local.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Local Products</h4>
                  <ul className="space-y-1">
                    {alternatives.local.map((alt) => (
                      <li key={alt.id}>
                        <Link 
                          to={`/products/${alt.id}`}
                          className="text-primary hover:underline"
                        >
                          {alt.name}
                        </Link>
                        <span className="text-muted-foreground text-sm"> - {alt.category}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {alternatives.external.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">External Alternatives</h4>
                  <ul className="space-y-1">
                    {alternatives.external.map((alt, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-foreground">{alt.name}</span>
                        {alt.url && (
                          <a 
                            href={alt.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
