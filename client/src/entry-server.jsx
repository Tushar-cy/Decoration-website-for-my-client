import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShopProvider } from "./context/ShopContext";
import { SettingsProvider } from "./context/SettingsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CustomerBottomNav from "./components/CustomerBottomNav";
import MaintenanceBanner from "./components/MaintenanceBanner";

// Direct imports for SSR to guarantee full synchronous rendering of <h1> and content
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import PlanMyEvent from "./pages/PlanMyEvent";
import LocalityPage from "./pages/LocalityPage";

function ServerLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <MaintenanceBanner />
      <Navbar />
      <main style={{ flexGrow: 1 }}>{children}</main>
      <Footer />
      <CustomerBottomNav />
    </div>
  );
}

export function render(url) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ShopProvider>
          <StaticRouter location={url}>
            <ServerLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/services" element={<Shop />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/plan-my-event" element={<PlanMyEvent />} />
                <Route path="/locations/:slug" element={<LocalityPage />} />
              </Routes>
            </ServerLayout>
          </StaticRouter>
        </ShopProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );

  return { html };
}
