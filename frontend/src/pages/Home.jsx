import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Scan, ShieldCheck, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 md:py-24 max-w-4xl mx-auto text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Make Ethical Choices.
          <br />
          Boycott with Confidence.
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
          Instantly check if a product is on the boycott list. 
          Scan barcodes, search products, and find ethical alternatives.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 w-full justify-center"
      >
        <Link to="/scan">
            <Button size="lg" className="h-12 px-8 text-lg gap-2 w-full sm:w-auto">
                <Scan className="h-5 w-5" />
                Start Scanning
            </Button>
        </Link>
        <Link to="/products">
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg gap-2 w-full sm:w-auto">
                <Search className="h-5 w-5" />
                Browse Products
            </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 w-full">
        <FeatureCard 
            icon={<Scan className="h-10 w-10 text-primary" />}
            title="Instant Scan"
            description="Scan barcodes to get immediate boycott status and detailed info."
        />
        <FeatureCard 
            icon={<ShieldCheck className="h-10 w-10 text-primary" />}
            title="Verified Proof"
            description="Access reliable proof and background information on every boycott."
        />
         <FeatureCard 
            icon={<Search className="h-10 w-10 text-primary" />}
            title="Find Alternatives"
            description="Discover ethical alternatives for boycotted products instantly."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="flex flex-col items-center p-6 border rounded-lg bg-card/50 hover:bg-card transition-colors">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}
