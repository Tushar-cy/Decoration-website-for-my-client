import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicProducts } from "../services/api";
import { formatPaise } from "../utils/money";
import { getOptimizedImageUrl } from "../utils/cloudinary";

function SearchAutocomplete({ placeholder = "Search setups, themes, colors...", onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Debounced API search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await getPublicProducts({ q: query.trim(), limit: 5 });
        const prods = res.data?.data?.products || [];
        setResults(prods);
        setIsOpen(true);
      } catch (err) {
        console.error("Autocomplete search error", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

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
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
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
    } else if (item.slug) {
      navigate(`/p/${item.slug}`);
    } else {
      navigate(`/shop?q=${encodeURIComponent(item.title)}`);
    }
  };

  const handleSubmitSearch = () => {
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
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
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
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
            fontSize: "16px", /* Prevents iOS auto-zoom */
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
          {isLoading ? (
            <div style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Searching live packages...
            </div>
          ) : results.length === 0 ? (
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
            results.map((item, idx) => {
              const imgUrl = item.images?.[0]?.url || item.image || "/decor-gallery/decor_001.jpg";
              return (
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
                    borderBottom: idx < results.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <img
                    src={getOptimizedImageUrl(imgUrl, { width: 100, height: 100 })}
                    alt={item.title}
                    loading="lazy"
                    width="48"
                    height="48"
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
                      <span style={{ fontSize: "0.72rem", color: "var(--text-light)" }}>
                        {item.categoryId?.name || item.category || "Setup"}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "var(--gold, #d4af37)", flexShrink: 0 }}>
                    View Setup ➔
                  </div>
                </div>
              );
            })
          )}

          {results.length > 0 && (
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
