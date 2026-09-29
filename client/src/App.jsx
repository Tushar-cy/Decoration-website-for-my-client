import React, { useEffect } from "react";
import { Routes, Route, useLocation, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WishlistModal from "./components/WishlistModal";
import ProductQuickViewModal from "./components/ProductQuickViewModal";
import Toast from "./components/Toast";
import { ShopProvider } from "./context/ShopContext";

// Customer Pages
import Home from "./pages/Home";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PlanMyEvent from "./pages/PlanMyEvent";

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

// Helper component to reset scroll position on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Layout wrapper for customer pages (includes Navbar and Footer)
function CustomerLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>
      <Footer />
      {/* Global Modals & Drawers */}
      <CartDrawer />
      <WishlistModal />
      <ProductQuickViewModal />
      <Toast />
    </div>
  );
}

function App() {
  return (
    <ShopProvider>
      <ScrollToTop />
      <Routes>
        {/* Customer Website Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="plan-my-event" element={<PlanMyEvent />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
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
          <Route path="coupons" element={<CategoriesManager />} />
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
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem" }}>404 - Page Not Found</h1>
              <p style={{ marginTop: "12px", color: "var(--text-light)" }}>The page you are looking for does not exist.</p>
              <a href="/" className="btn btn-gold" style={{ marginTop: "24px" }}>
                Return to Home
              </a>
            </div>
          }
        />
      </Routes>
    </ShopProvider>
  );
}

export default App;
