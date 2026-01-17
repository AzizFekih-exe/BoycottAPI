import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Authentication from "./pages/Authentication";
import AuthCallback from "./pages/AuthCallback";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CompanyList from "./pages/CompanyList";
import ScanPage from "./pages/ScanPage";
import Profile from "./pages/Profile";
import SubmitProduct from "./pages/SubmitProduct";
import SubmitProof from "./pages/SubmitProof";
import SubmitCompany from "./pages/SubmitCompany";
import PendingRequests from "./pages/PendingRequests";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Authentication />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/companies" element={<CompanyList />} />
            <Route path="/scan" element={<ScanPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Contributor+ Routes */}
            <Route 
              path="/submit/product" 
              element={
                <ProtectedRoute requiredRoles={["CONTRIBUTOR", "MODERATOR", "ADMIN"]}>
                  <SubmitProduct />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/submit/proof" 
              element={
                <ProtectedRoute requiredRoles={["CONTRIBUTOR", "MODERATOR", "ADMIN"]}>
                  <SubmitProof />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/submit/company" 
              element={
                <ProtectedRoute requiredRoles={["CONTRIBUTOR", "MODERATOR", "ADMIN"]}>
                  <SubmitCompany />
                </ProtectedRoute>
              } 
            />
            
            {/* Moderator+ Routes */}
            <Route 
              path="/pending" 
              element={
                <ProtectedRoute requiredRoles={["MODERATOR", "ADMIN"]}>
                  <PendingRequests />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRoles={["ADMIN"]}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
