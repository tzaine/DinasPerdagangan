import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";

// Public pages (eagerly loaded – small)
import LandingPage from "./pages/LandingPage";

// Code-split heavy pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MapPage = lazy(() => import("./pages/MapPage"));

// Admin (separate chunk)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const KiosManagement = lazy(() => import("./pages/admin/KiosManagement"));
const LayerManagement = lazy(() => import("./pages/admin/LayerManagement"));

function PageLoader() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ fontSize: 14 }}>Memuat halaman...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/peta" element={<MapPage />} />
          </Route>

          {/* Admin login (standalone) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin panel */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="kios" element={<KiosManagement />} />
            <Route path="layers" element={<LayerManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
