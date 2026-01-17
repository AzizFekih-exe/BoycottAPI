import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card";
import { Badge } from "lucide-react"; // Wait, I meant a UI Badge component. I'll just style a div.
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";

export function ProductCard({ product }) {
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

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl truncate pr-2" title={product.name}>
                {product.name}
            </CardTitle>
            <div className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(product.boycott_status)}`}>
                {product.boycott_status}
            </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {product.description || "No description available."}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-1 rounded">{product.serial_number}</span>
            {product.category && <span className="capitalize">• {product.category}</span>}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/products/${product.id}`} className="w-full">
            <Button variant="outline" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
