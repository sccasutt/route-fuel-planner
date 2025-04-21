
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  CircleUser,
  ChevronDown,
  Menu,
  X,
  Bike,
  Map,
  Utensils,
  LineChart,
  User
} from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Helper function to handle sign out and redirect
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bike className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">PedalPlate</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/routes" className="text-sm font-medium hover:text-primary transition-colors">
                Routes
              </Link>
              <Link to="/nutrition" className="text-sm font-medium hover:text-primary transition-colors">
                Nutrition
              </Link>
              <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                Profile
              </Link>
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <CircleUser className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b">
          <div className="container py-4 space-y-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <LineChart className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/routes"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <Map className="h-5 w-5" />
                  <span>Routes</span>
                </Link>
                <Link
                  to="/nutrition"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <Utensils className="h-5 w-5" />
                  <span>Nutrition</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4"
                  onClick={async () => {
                    await signOut();
                    toggleMenu();
                    navigate("/");
                  }}
                >
                  <CircleUser className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/features"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <span>Features</span>
                </Link>
                <Link
                  to="/pricing"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <span>Pricing</span>
                </Link>
                <Link
                  to="/about"
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                  onClick={toggleMenu}
                >
                  <span>About</span>
                </Link>
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login" onClick={toggleMenu}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register" onClick={toggleMenu}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

