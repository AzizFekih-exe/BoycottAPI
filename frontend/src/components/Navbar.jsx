import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { 
  Scan, 
  LogOut, 
  User, 
  QrCode, 
  FilePlus, 
  ClipboardList, 
  Shield,
  LayoutDashboard,
  Package,
  Building2
} from "lucide-react";

export function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const menuItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Products", path: "/products", icon: Package },
    { label: "Companies", path: "/companies", icon: Building2 },
  ];

  const adminItems = [
    { 
      label: "Submit", 
      path: "/submit/product", 
      icon: FilePlus, 
      show: hasRole("CONTRIBUTOR", "MODERATOR", "ADMIN") 
    },
    { 
      label: "Pending", 
      path: "/pending", 
      icon: ClipboardList, 
      show: hasRole("MODERATOR", "ADMIN") 
    },
    { 
      label: "Admin", 
      path: "/admin", 
      icon: Shield, 
      show: hasRole("ADMIN") 
    },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 md:px-8 container mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl mr-8 text-primary shrink-0">
          <QrCode className="h-6 w-6" />
          <span className="hidden sm:inline-block">BoycottAPI</span>
        </Link>
        
        <div className="flex items-center space-x-1 lg:space-x-4 mx-2 overflow-x-auto no-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                location.pathname === item.path ? "bg-accent text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {adminItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                location.pathname === item.path ? "bg-accent text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <Link to="/scan">
            <Button variant="ghost" size="icon" title="Scan Barcode">
              <Scan className="h-5 w-5" />
            </Button>
          </Link>
          
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/profile">
                <Button variant="ghost" size="icon" title="Profile">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-bold text-primary">{user.role}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.display_name || user.email}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
