import React, { useEffect } from "react";
import { Routes, Route, useLocation, Outlet, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WishlistModal from "./components/WishlistModal";
import ProductQuickViewModal from "./components/ProductQuickViewModal";
import Toast from "./components/Toast";
import CustomerBottomNav from "./components/CustomerBottomNav";
import InstallPrompt from "./components/pwa/InstallPrompt";
import PwaUpdatePrompt from "./components/pwa/PwaUpdatePrompt";
import { ShopProvider } from "./context/ShopContext";
import { SettingsProvider } from "./context/SettingsContext";
import MaintenanceBanner from "./components/MaintenanceBanner";
import CookieConsentBanner from "./components/CookieConsentBanner";

// Storefront Pages (Route-level code splitting with React.lazy)
const Home = React.lazy(() => import("./pages/Home"));
const Shop = React.lazy(() => import("./pages/Shop"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));
const OrderTracking = React.lazy(() => import("./pages/OrderTracking"));
const Gallery = React.lazy(() => import("./pages/Gallery"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const PlanMyEvent = React.lazy(() => import("./pages/PlanMyEvent"));
const LocalityPage = React.lazy(() => import("./pages/LocalityPage"));

// Admin Portal Pages (Code-split with React.lazy so customers NEVER download admin code)
const AdminLogin = React.lazy(() => import("./admin/AdminLogin"));
const AdminLayout = React.lazy(() => import("./admin/AdminLayout"));
const Dashboard = React.lazy(() => import("./admin/Dashboard"));
const OrdersManager = React.lazy(() => import("./admin/OrdersManager"));
const ProductsManager = React.lazy(() => import("./admin/ProductsManager"));
const CategoriesManager = React.lazy(() => import("./admin/CategoriesManager"));
const AvailabilityManager = React.lazy(() => import("./admin/AvailabilityManager"));
const FormBuilder = React.lazy(() => import("./admin/FormBuilder"));
const SubmissionsManager = React.lazy(() => import("./admin/SubmissionsManager"));
const GalleryManager = React.lazy(() => import("./admin/GalleryManager"));
const TestimonialManager = React.lazy(() => import("./admin/TestimonialManager"));
const SettingsManager = React.lazy(() => import("./admin/SettingsManager"));
const UsersManager = React.lazy(() => import("./admin/UsersManager"));
const AuditLogManager = React.lazy(() => import("./admin/AuditLogManager"));

// Customer TanStack Query Client with required cache and retry parameters
export const storefrontQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2, // 2 retries with exponential backoff
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        color: "var(--gold)",
        fontSize: "1.1rem",
        fontWeight: 500,
        gap: "10px",
      }}
    >
      <span>✨ Loading celebration details...</span>
    </div>
  );
}

function AdminLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        color: "#64748b",
        fontFamily: "inherit",
      }}
    >
      <span>Loading Admin Module...</span>
    </div>
  );
}

// Reset scroll position on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Layout wrapper for customer pages
function CustomerLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <InstallPrompt />
      <MaintenanceBanner />
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        <React.Suspense fallback={<PageLoading />}>
          <Outlet />
        </React.Suspense>
      </main>
      <Footer />
      {/* Mobile Customer Bottom Navigation Bar */}
      <CustomerBottomNav />
      {/* Global Modals & Drawers */}
      <CartDrawer />
      <WishlistModal />
      <ProductQuickViewModal />
      <Toast />
      {/* PWA Update Banner */}
      <PwaUpdatePrompt />
      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={storefrontQueryClient}>
      <SettingsProvider>
        <ShopProvider>
          <ScrollToTop />
          <Routes>
            {/* Customer Website Routes */}
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="services" element={<Shop />} />
              <Route path="p/:slug" element={<ProductDetail />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order/:orderNumber" element={<OrderTracking />} />
              <Route path="plan-my-event" element={<PlanMyEvent />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="locations/:slug" element={<LocalityPage />} />
            </Route>

            {/* Code-Split Admin Portal Routes */}
            <Route
              path="/admin/login"
              element={
                <React.Suspense fallback={<AdminLoading />}>
                  <AdminLogin />
                </React.Suspense>
              }
            />

            <Route
              path="/admin"
              element={
                <React.Suspense fallback={<AdminLoading />}>
                  <AdminLayout />
                </React.Suspense>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<OrdersManager />} />
              <Route path="products" element={<ProductsManager />} />
              <Route path="categories" element={<CategoriesManager />} />
              <Route path="coupons" element={<Navigate to="/admin/categories?tab=coupons" replace />} />
              <Route path="availability" element={<AvailabilityManager />} />
              <Route path="forms" element={<FormBuilder />} />
              <Route path="submissions" element={<SubmissionsManager />} />
              <Route path="gallery" element={<GalleryManager />} />
              <Route path="testimonials" element={<TestimonialManager />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="users" element={<UsersManager />} />
              <Route path="audit-logs" element={<AuditLogManager />} />
            </Route>

            {/* 404 Fallback Route */}
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "100px 20px" }}>
                  <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem" }}>
                    404 - Page Not Found
                  </h1>
                  <p style={{ marginTop: "12px", color: "var(--text-light)" }}>
                    The page you are looking for does not exist.
                  </p>
                  <a href="/" className="btn btn-gold" style={{ marginTop: "24px" }}>
                    Return to Home
                  </a>
                </div>
              }
            />
          </Routes>
        </ShopProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
