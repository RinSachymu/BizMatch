import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Discover from "@/pages/Discover";
import Matches from "@/pages/Matches";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import AppLayout from "@/components/AppLayout";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;
  }
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;
  }
  if (user && user !== false) return <Navigate to="/discover" replace />;
  return children;
}

function AppShell({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  useEffect(() => { document.title = "BizMatch — Deal flow, redesigned"; }, []);
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors closeButton />
          <Routes>
            <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            <Route path="/onboarding" element={<ProtectedRoute><AppShell><Profile isOnboarding /></AppShell></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><AppShell><Discover /></AppShell></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><AppShell><Matches /></AppShell></ProtectedRoute>} />
            <Route path="/matches/:matchId" element={<ProtectedRoute><AppShell><Chat /></AppShell></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
