import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { usePublicSettings } from "../context/SettingsContext";
import "../styles/customerBottomNav.css";

function CustomerBottomNav() {
  const location = useLocation();
  const { wishlist, setIsWishlistOpen } = useShop();
  const { cleanWhatsapp } = usePublicSettings();

  // Hide general bottom nav on product detail pages because they have dedicated package-level sticky enquiry CTAs
  if (location.pathname.startsWith("/p/")) {
    return null;
  }

  const waMsg = encodeURIComponent("Hi Decor Joy Gurgaon! I am planning an event and would like to inquire about your decoration packages.");
  const waUrl = `https://wa.me/${cleanWhatsapp || "917015767715"}?text=${waMsg}`;

  return (
    <nav className="customer-bottom-nav" aria-label="Mobile Bottom Navigation">
      {/* Home Tab */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "bottom-tab-item active" : "bottom-tab-item"
        }
        aria-label="Home"
      >
        <span className="bottom-tab-icon">🏠</span>
        <span className="bottom-tab-label">Home</span>
      </NavLink>

      {/* Catalog Setups */}
      <NavLink
        to="/shop"
        className={({ isActive }) =>
          isActive ? "bottom-tab-item active" : "bottom-tab-item"
        }
        aria-label="Catalog Packages"
      >
        <span className="bottom-tab-icon">🎈</span>
        <span className="bottom-tab-label">Catalog</span>
      </NavLink>

      {/* Plan My Event / Purpose Forms */}
      <NavLink
        to="/plan-my-event"
        className={({ isActive }) =>
          isActive ? "bottom-tab-item active" : "bottom-tab-item"
        }
        aria-label="Plan My Event"
      >
        <span className="bottom-tab-icon">✨</span>
        <span className="bottom-tab-label">Plan Event</span>
      </NavLink>

      {/* Saved / Wishlist */}
      <button
        type="button"
        className="bottom-tab-item"
        onClick={() => setIsWishlistOpen(true)}
        aria-label={`Saved items (${wishlist.length})`}
      >
        <span className="bottom-tab-icon">
          ❤️
          {wishlist.length > 0 && (
            <span className="bottom-tab-badge">{wishlist.length}</span>
          )}
        </span>
        <span className="bottom-tab-label">Saved</span>
      </button>

      {/* 1-Tap WhatsApp Inquire CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bottom-tab-item"
        aria-label="Inquire on WhatsApp"
        style={{ color: "#25D366" }}
      >
        <span className="bottom-tab-icon">💬</span>
        <span className="bottom-tab-label">WhatsApp</span>
      </a>
    </nav>
  );
}

export default CustomerBottomNav;
