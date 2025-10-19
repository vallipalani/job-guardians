import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import UserAuth from "./pages/UserAuth";
import CompanyAuth from "./pages/CompanyAuth";
import Detect from "./pages/Detect";
import Reviews from "./pages/Reviews";
import UserProfile from "./pages/UserProfile";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyPublic from "./pages/CompanyPublic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/user-auth" element={<UserAuth />} />
          <Route path="/company-auth" element={<CompanyAuth />} />
          <Route path="/detect" element={<Detect />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/company/:id" element={<CompanyPublic />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
