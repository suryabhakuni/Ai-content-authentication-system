import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/img.png";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { toast } = useToast();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Upload", path: "/upload" },
    { name: "Verify", path: "/verify" },
    { name: "About", path: "/about" },
  ];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(
            -4
          )}`,
        });
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to connect your wallet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 text-lg font-semibold text-foreground hover:text-primary transition-fast"
          >
            <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
            <span className="hidden sm:inline">AI Content Authenticator</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-fast relative ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
                {isActive(item.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={connectWallet}
              className="flex items-center gap-2 h-9 px-4 transition-fast hover:scale-105"
            >
              <Wallet size={16} />
              <span className="text-sm">
                {account
                  ? `${account.slice(0, 6)}...${account.slice(-4)}`
                  : "Connect"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 transition-fast hover:scale-105"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden h-9 w-9 p-0"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md md:hidden z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm border-l-2 border-gray-300 dark:border-gray-700 md:hidden z-50 shadow-2xl overflow-y-auto"
              style={{
                backgroundColor: "#ffffff",
              }}
            >
              {/* Close Button */}
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-9 w-9 p-0 text-gray-900 hover:bg-gray-100"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex flex-col h-full pt-20 px-6 bg-white dark:bg-[#272935]">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`py-4 text-lg font-medium transition-fast flex items-center min-h-[44px] ${
                        isActive(item.path)
                          ? "text-[#4f46e5]"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}

                <div className="mt-8 space-y-3">
                  <Button
                    variant="outline"
                    onClick={connectWallet}
                    className="w-full flex items-center justify-center gap-2 h-11"
                  >
                    <Wallet size={16} />
                    <span>
                      {account
                        ? `${account.slice(0, 6)}...${account.slice(-4)}`
                        : "Connect Wallet"}
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 h-11"
                  >
                    {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                    <span>
                      {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
