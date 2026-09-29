import React from "react";
import { NavLink } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/customerBottomNav.css";

function CustomerBottomNav() {
  const { cartCount, wishlist, setIsCartOpen, setIsWishlistOpen } = useShop();

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

      {/* Shop Setups */}
      <NavLink
        to="/shop"
        className={({ isActive }) =>
          isActive ? "bottom-tab-item active" : "bottom-tab-item"
        }
        aria-label="Shop Setups"
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

      {/* Celebration Bag / Cart */}
      <button
        type="button"
        className="bottom-tab-item"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Celebration bag (${cartCount} items)`}
      >
        <span className="bottom-tab-icon">
          🛍️
          {cartCount > 0 && (
            <span className="bottom-tab-badge bottom-tab-badge-dark">
              {cartCount}
            </span>
          )}
        </span>
        <span className="bottom-tab-label">Bag</span>
      </button>
    </nav>
  );
}

export default CustomerBottomNav;
