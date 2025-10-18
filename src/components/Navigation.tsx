import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NavigationProps {
  user: any;
}

export const Navigation = ({ user }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JobGuardian</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/detect" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/detect" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Detect
            </Link>
            <Link 
              to="/reviews" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/reviews" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Reviews
            </Link>
            <Link 
              to="/company" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/company" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              For Companies
            </Link>
            
            {user ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};