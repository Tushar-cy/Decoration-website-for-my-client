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

// Admin Portal Pages
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import ServicesManager from "./admin/ServicesManager";
import GalleryManager from "./admin/GalleryManager";
import InquiryManager from "./admin/InquiryManager";
import TestimonialManager from "./admin/TestimonialManager";
import FormBuilder from "./admin/FormBuilder";
import SubmissionsManager from "./admin/SubmissionsManager";

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

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Portal Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="submissions" element={<SubmissionsManager />} />
          <Route path="forms" element={<FormBuilder />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="inquiries" element={<InquiryManager />} />
          <Route path="testimonials" element={<TestimonialManager />} />
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
