import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { AppSidebar } from "@/components/Layout/Sidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import TasksDebug from "./pages/TasksDebug";
import Meetings from "./pages/Meetings";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProjectDetail from "./pages/ClientProjectDetail";
import ClientInvite from "./pages/ClientInvite";

// Create QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              {/* Client Routes - Public invitation */}
              <Route path="/client/invite/:token" element={<ClientInvite />} />

              {/* Client Routes - Protected */}
              <Route path="/client/dashboard" element={
                <ProtectedRoute allowedRoles={['cliente']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/client/project/:projectId" element={
                <ProtectedRoute allowedRoles={['cliente']}>
                  <ClientProjectDetail />
                </ProtectedRoute>
              } />

              <Route path="/projects" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Projects />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/projects/:projectId" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <ProjectDetails />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/tasks-debug" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <TasksDebug />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Tasks />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/meetings" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Meetings />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Clients />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Settings />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Index />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
