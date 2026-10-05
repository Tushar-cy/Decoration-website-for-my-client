import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";
import SearchAutocomplete from "./SearchAutocomplete";
import { useShop } from "../context/ShopContext";
import "../styles/navbar.css";

const CATEGORY_ITEMS = [
  { name: "🎂 Birthday Setups", category: "Birthdays", desc: "Ring arches, marquee numbers & themes" },
  { name: "💍 Romantic Anniversaries", category: "Anniversaries", desc: "Terrace cabanas & candlelight drapes" },
  { name: "👶 Baby Showers & Welcome", category: "Baby Showers", desc: "Pastel organic balloon clouds" },
  { name: "🕯️ Marry Me Proposals", category: "Proposals", desc: "4ft illuminated marquee letters" },
  { name: "✨ Haldi & Special Occasions", category: "Special Celebrations", desc: "Traditional florals & royal drapes" },
];

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    wishlist,
    setIsWishlistOpen,
  } = useShop();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryMenuOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleCustomizerClick = (e) => {
    closeMobileMenu();
    if (location.pathname === "/") {
      const el = document.getElementById("decor-builder");
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleCategoryClick = (category) => {
    setIsCategoryMenuOpen(false);
    closeMobileMenu();
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  return (
    <header className="site-navbar" role="banner">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={closeMobileMenu} aria-label="Decor Joy Gurgaon Home">
          <div className="brand-icon">✨</div>
          <div className="brand-text">
            <span className="brand-title">Decor Joy <span>Gurgaon</span></span>
            <span className="brand-subtitle">Celebration Styling</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation">
          <ul className="nav-links-desktop">
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Home
              </NavLink>
            </li>

            {/* Category Dropdown */}
            <li ref={categoryMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="nav-link"
                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="true"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: isCategoryMenuOpen ? "var(--gold)" : "var(--dark)",
                }}
              >
                <span>Browse Categories</span>
                <span style={{ fontSize: "0.75rem", transition: "transform 0.2s ease", transform: isCategoryMenuOpen ? "rotate(180deg)" : "none" }}>
                  ▼
                </span>
              </button>

              {isCategoryMenuOpen && (
                <div
                  role="menu"
                  className="category-dropdown-panel"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 14px)",
                    left: "-30px",
                    width: "320px",
                    background: "var(--white)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-lg)",
                    padding: "12px",
                    zIndex: 1005,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {CATEGORY_ITEMS.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      role="menuitem"
                      onClick={() => handleCategoryClick(item.category)}
                      style={{
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-alt)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--dark)" }}>{item.name}</span>
                      <span style={{ fontSize: "0.76rem", color: "var(--text-light)" }}>{item.desc}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", marginTop: "4px" }}>
                    <Link
                      to="/shop"
                      onClick={() => setIsCategoryMenuOpen(false)}
                      style={{
                        display: "block",
                        textAlign: "center",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--dark-gold)",
                        padding: "6px",
                      }}
                    >
                      View All Setups Catalog ➔
                    </Link>
                  </div>
                </div>
              )}
            </li>

            <li>
              <NavLink to="/shop" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Shop Setups
              </NavLink>
            </li>

            <li>
              <NavLink to="/plan-my-event" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                🎉 Plan My Event
              </NavLink>
            </li>

            <li>
              <a
                href="/#decor-builder"
                onClick={handleCustomizerClick}
                className="nav-link nav-link-highlight"
              >
                <span>⚡ Customizer</span>
              </a>
            </li>

            <li>
              <NavLink to="/gallery" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Gallery
              </NavLink>
            </li>

            <li>
              <NavLink to="/about" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                About
              </NavLink>
            </li>

            <li>
              <NavLink to="/contact" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Search Bar in Navbar */}
        <div className="nav-search-container" style={{ width: "240px", display: "none" }}>
          <SearchAutocomplete placeholder="Search decor..." />
        </div>

        {/* Action Buttons: Wishlist, Cart & WhatsApp */}
        <div className="navbar-actions">
          {/* Wishlist Button */}
          <button
            type="button"
            className="nav-action-icon-btn"
            onClick={() => setIsWishlistOpen(true)}
            aria-label={`View saved wishlist items (${wishlist.length})`}
            style={{
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: "8px",
            }}
          >
            <span>❤️</span>
            {wishlist.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "0px",
                  background: "var(--gold)",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {wishlist.length}
              </span>
            )}
          </button>

          {/* WhatsApp Direct Action */}
          <WhatsAppButton
            text="WhatsApp Us"
            message="Hello Decor Joy Gurgaon! I'd like to check date availability for decoration."
            className="nav-whatsapp-btn"
          />

          {/* Mobile Hamburger Toggle */}
          <button
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-nav-drawer ${isMobileMenuOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        {/* Mobile Search */}
        <div style={{ marginBottom: "16px" }}>
          <SearchAutocomplete placeholder="Search setups & themes..." onSelect={closeMobileMenu} />
        </div>

        <ul className="mobile-nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")} onClick={closeMobileMenu}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/shop" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")} onClick={closeMobileMenu}>
              Shop Setups & Packages
            </NavLink>
          </li>
          <li>
            <NavLink to="/plan-my-event" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")} onClick={closeMobileMenu}>
              🎉 Plan My Event (Purpose Forms)
            </NavLink>
          </li>

          {/* Category List in Mobile Drawer */}
          <li style={{ padding: "8px 0" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Shop By Occasion
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", paddingLeft: "10px" }}>
              {CATEGORY_ITEMS.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => handleCategoryClick(item.category)}
                  style={{
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    color: "var(--dark)",
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "4px 0",
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </li>

          <li>
            <a
              href="/#decor-builder"
              onClick={handleCustomizerClick}
              className="mobile-nav-link"
              style={{ color: "var(--dark-gold)", fontWeight: 700 }}
            >
              ⚡ Instant Decor Customizer
            </a>
          </li>
          <li>
            <NavLink to="/gallery" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")} onClick={closeMobileMenu}>
              Real Event Gallery
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")} onClick={closeMobileMenu}>
              About Us & Guarantee
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")} onClick={closeMobileMenu}>
              Contact & Booking Form
            </NavLink>
          </li>
        </ul>

        {/* Mobile Bag / Wishlist Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              closeMobileMenu();
              setIsWishlistOpen(true);
            }}
            style={{ flex: 1, padding: "10px" }}
          >
            ❤️ Saved ({wishlist.length})
          </button>
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => {
              closeMobileMenu();
              navigate("/plan-my-event");
            }}
            style={{ flex: 1, padding: "10px" }}
          >
            ✨ Plan Event
          </button>
        </div>

        <div className="mobile-nav-actions">
          <WhatsAppButton
            text="Chat on WhatsApp (Fastest)"
            message="Hello Decor Joy Gurgaon! I'd like to check date availability for decoration."
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
