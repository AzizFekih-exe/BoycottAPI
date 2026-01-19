import { useState } from "react";
import { Package, Building2, FileText } from "lucide-react";
import SubmitProduct from "./SubmitProduct";
import SubmitCompany from "./SubmitCompany";
import SubmitProof from "./SubmitProof";
import { Button } from "../components/ui/Button";

export default function SubmitPanel() {
  const [activeTab, setActiveTab] = useState("product");

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Submission Panel</h1>
          <p className="text-muted-foreground mt-1">
            Contribute to the boycott database by submitting new entries
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-2 max-w-2xl mx-auto flex gap-2 overflow-x-auto">
        <Button
          variant={activeTab === "product" ? "default" : "ghost"}
          className="flex-1 justify-center gap-2"
          onClick={() => setActiveTab("product")}
        >
          <Package className="h-4 w-4" />
          Product
        </Button>
        <Button
          variant={activeTab === "company" ? "default" : "ghost"}
          className="flex-1 justify-center gap-2"
          onClick={() => setActiveTab("company")}
        >
          <Building2 className="h-4 w-4" />
          Company
        </Button>
        <Button
          variant={activeTab === "proof" ? "default" : "ghost"}
          className="flex-1 justify-center gap-2"
          onClick={() => setActiveTab("proof")}
        >
          <FileText className="h-4 w-4" />
          Proof
        </Button>
      </div>

      <div className="mt-8">
        {activeTab === "product" && (
          // We can optionally hide the internal header of the component using CSS or just let it be.
          // Since the component has its own 'Submit New Product' H1, maybe we can hide it 
          // or just wrap it in a div that styling tweaks.
          // For now, let's just render it. The nested H1 is slightly redundant but acceptable.
          <SubmitProduct />
        )}
        {activeTab === "company" && <SubmitCompany />}
        {activeTab === "proof" && <SubmitProof />}
      </div>
    </div>
  );
}
