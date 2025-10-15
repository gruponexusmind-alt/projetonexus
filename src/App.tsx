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
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const Clients = lazy(() => import("./pages/Clients"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Tasks = lazy(() => import("./pages/Tasks"));
const MyDay = lazy(() => import("./pages/MyDay"));
const Timeline = lazy(() => import("./pages/Timeline"));
const TasksDebug = lazy(() => import("./pages/TasksDebug"));
const Meetings = lazy(() => import("./pages/Meetings"));
const Settings = lazy(() => import("./pages/Settings"));
const TimeReports = lazy(() => import("./pages/TimeReports"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientProjectDetail = lazy(() => import("./pages/ClientProjectDetail"));
const ClientInvite = lazy(() => import("./pages/ClientInvite"));
const PublicProjectView = lazy(() => import("./pages/PublicProjectView"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              {/* Public Project View - No authentication required */}
              <Route path="/project/view/:token" element={<PublicProjectView />} />

              {/* Client Routes - Public invitation (deprecated, kept for backwards compatibility) */}
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
              {/* Debug route - only available in development */}
              {import.meta.env.DEV && (
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
              )}
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
              <Route path="/my-day" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <MyDay />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              <Route path="/timeline" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <Timeline />
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
              <Route path="/time-reports" element={
                <ProtectedRoute allowedRoles={['admin', 'operacional']}>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <TimeReports />
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
