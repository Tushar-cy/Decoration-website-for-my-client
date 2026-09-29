import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_SERVICES } from "../services/api";
import { useShop } from "../context/ShopContext";

function SearchAutocomplete({ placeholder = "Search setups, themes, colors...", onSelect }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const { setQuickViewProduct } = useShop();

  const filteredResults = query.trim()
    ? DEFAULT_SERVICES.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.color?.toLowerCase().includes(q) ||
          item.material?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      } else {
        handleSubmitSearch();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item) => {
    setIsOpen(false);
    setQuery("");
    if (onSelect) {
      onSelect(item);
    } else {
      setQuickViewProduct(item);
    }
  };

  const handleSubmitSearch = () => {
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/services?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="search-autocomplete-wrapper" ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div className="search-input-box" style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: "14px", fontSize: "0.95rem", color: "var(--text-muted)", pointerEvents: "none" }}>
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search decoration packages"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          style={{
            width: "100%",
            padding: "10px 38px 10px 38px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border)",
            background: "var(--white)",
            fontSize: "0.88rem",
            outline: "none",
            color: "var(--dark)",
            transition: "var(--transition)",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              padding: "2px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim() && (
        <div
          role="listbox"
          className="search-results-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 1001,
            maxHeight: "360px",
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          {filteredResults.length === 0 ? (
            <div style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              No setups found for "{query}".
              <div style={{ marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={handleSubmitSearch}
                  className="btn btn-outline"
                  style={{ padding: "6px 14px", fontSize: "0.78rem", marginTop: "8px" }}
                >
                  Search all catalog ↗
                </button>
              </div>
            </div>
          ) : (
            filteredResults.map((item, idx) => (
              <div
                key={item._id}
                role="option"
                aria-selected={selectedIndex === idx}
                onClick={() => handleSelectItem(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: selectedIndex === idx ? "var(--gold-light)" : "transparent",
                  borderBottom: idx < filteredResults.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-light)" }}>{item.category}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--border)" }}>•</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--dark-gold)", fontWeight: 600 }}>{item.color}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--dark)", flexShrink: 0 }}>
                  ₹{item.startingPrice?.toLocaleString("en-IN")}
                </div>
              </div>
            ))
          )}

          {filteredResults.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleSubmitSearch}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--dark-gold)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                View all results for "{query}" ➔
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
