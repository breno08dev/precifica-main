import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Insumos from "./pages/Insumos";
import Preparados from "./pages/Preparados";
import Produtos from "./pages/Produtos";
import Assinatura from "./pages/Assinatura";
import NotFound from "./pages/NotFound";
import { ChefHat } from "lucide-react";

const queryClient = new QueryClient();

// Componente para mostrar o título da página atual no Header
const PageTitle = () => {
  const location = useLocation();
  const path = location.pathname;
  
  let pageName = "";
  if (path === "/dashboard") pageName = "Dashboard";
  else if (path === "/insumos") pageName = "Insumos";
  else if (path === "/preparados") pageName = "Produtos Preparados";
  else if (path === "/produtos") pageName = "Cardápio";
  else if (path === "/assinatura") pageName = "Planos & Assinatura";

  return (
    <div className="flex items-center gap-2 ml-4 transition-all">
      {/* Logo / Nome da Empresa */}
      <div className="flex items-center gap-2 text-primary">
        <ChefHat className="h-6 w-6" strokeWidth={2.5} />
        <span className="font-bold text-xl tracking-tight">PrecificaAi</span>
      </div>

      {/* Divisor e Nome da Página (só aparece se tiver página definida) */}
      {pageName && (
        <>
          <span className="text-muted-foreground/30 text-2xl font-light mx-1">/</span>
          <span className="font-medium text-lg text-muted-foreground animate-in fade-in slide-in-from-left-2">
            {pageName}
          </span>
        </>
      )}
    </div>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <header className="h-16 border-b flex items-center px-6 bg-card justify-between sticky top-0 z-10 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center">
            <SidebarTrigger />
            <PageTitle />
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <main className="flex-1 p-6 bg-background overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="precifica-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Rotas Protegidas (Exigem Login) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insumos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Insumos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/preparados"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Preparados />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Produtos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assinatura"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Assinatura />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;