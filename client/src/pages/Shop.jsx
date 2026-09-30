import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts, getPublicCategories } from "../services/api";
import { formatPaise } from "../utils/money";
import { getOptimizedImageUrl, getImageSrcSet } from "../utils/cloudinary";
import { useShop } from "../context/ShopContext";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { ErrorState } from "../components/common/ErrorState";
import SEO from "../components/SEO";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "../utils/jsonLd";
import "../styles/shop.css";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleWishlist, isInWishlist } = useShop();

  // URL state
  const activeCategory = searchParams.get("category") || "All";
  const initialQuery = searchParams.get("q") || "";
  const activeSort = searchParams.get("sort") || "featured";

  // Local state for debounced search and filters
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedSort, setSelectedSort] = useState(activeSort);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Categories Query
  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await getPublicCategories();
      return res.data?.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    return [{ _id: "all", name: "All Setups", slug: "All" }, ...(categoriesData || [])];
  }, [categoriesData]);

  // Products Query
  const productQueryParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: 12,
    };
    if (activeCategory && activeCategory !== "All") params.category = activeCategory;
    if (debouncedQuery) params.q = debouncedQuery;
    if (selectedSort === "price_asc") params.sort = "price_asc";
    if (selectedSort === "price_desc") params.sort = "price_desc";
    if (selectedSort === "rating") params.sort = "rating";
    if (selectedSort === "newest") params.sort = "newest";
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    return params;
  }, [activeCategory, debouncedQuery, selectedSort, minPrice, maxPrice, currentPage]);

  const {
    data: productsResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["public-products", productQueryParams],
    queryFn: async () => {
      const res = await getPublicProducts(productQueryParams);
      return res.data?.data;
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const products = productsResult?.products || [];
  const pagination = productsResult?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleCategorySelect = (catSlug) => {
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (catSlug === "All") {
      newParams.delete("category");
    } else {
      newParams.set("category", catSlug);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    setSelectedSort(e.target.value);
    setCurrentPage(1);
  };

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
  ]);

  const serviceFaqsSchema = buildFaqJsonLd([
    {
      question: "How far in advance should I book my decoration setup?",
      answer:
        "While we accept same-day bookings up to 3 hours in advance depending on slot availability, we recommend reserving 2 to 3 days prior for customized color themes.",
    },
    {
      question: "What is included in the package price?",
      answer:
        "All listed prices include the balloons, metal frame rental, LED fairy lights/neons (if specified), on-site installation by our stylists, and pickup of rental frames.",
    },
    {
      question: "Do you decorate outdoor balconies and terraces?",
      answer:
        "Yes, our cabanas and balloon arches include weighted structural stands engineered for windy outdoor terraces and condominium balconies across Gurgaon.",
    },
  ]);

  return (
    <div className="shop-page">
      <SEO
        title="Event Decoration Packages & Balloon Themes | Decor Joy Gurgaon"
        description="Browse premium event decoration packages in Gurgaon. Birthday balloon arches, romantic cabanas, baby shower setups, and custom celebrations."
        canonical="/shop"
        jsonLd={[breadcrumbSchema, serviceFaqsSchema]}
      />
      {/* Header Banner */}
      <section className="shop-header">
        <div className="container">
          <span className="badge-gold">Gurugram's Premier Event Stylists</span>
          <h1 className="shop-title">Celebration Catalog & Custom Setups</h1>
          <p className="shop-description">
            Organic balloon arches, romantic candlelight cabanas, and neon backdrops crafted for Gurgaon homes, terraces, and venues.
          </p>

          {/* Search bar */}
          <div className="shop-search-wrap">
            <input
              type="text"
              className="shop-search-input"
              placeholder="Search birthdays, anniversary cabanas, neon rings..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search celebration packages"
            />
            {searchInput && (
              <button
                type="button"
                className="shop-search-clear"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="shop-category-chips" role="tablist">
            {categories.map((cat) => {
              const isActive = (cat.slug === "All" && activeCategory === "All") || activeCategory === cat.slug;
              return (
                <button
                  key={cat._id}
                  type="button"
                  className={`chip ${isActive ? "chip-active" : ""}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                  role="tab"
                  aria-selected={isActive}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container shop-body">
        {/* Controls Bar: Results Count & Sort */}
        <div className="shop-controls">
          <div className="shop-results-count">
            Showing {products.length} of {pagination.total || products.length} setups
          </div>

          <div className="shop-sort-wrap">
            <label htmlFor="shop-sort" className="shop-sort-label">Sort by:</label>
            <select
              id="shop-sort"
              className="shop-sort-select"
              value={selectedSort}
              onChange={handleSortChange}
            >
              <option value="featured">Featured / Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="shop-grid">
            <LoadingSkeleton count={8} type="card" />
          </div>
        )}

        {/* Error State with Retry Button */}
        {isError && (
          <ErrorState
            title="Failed to Load Setups"
            message={error?.response?.data?.message || error?.message || "We could not retrieve the product catalog."}
            onRetry={() => refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="shop-empty">
            <div className="shop-empty-icon">🎈</div>
            <h3>No setups match your filters</h3>
            <p>Try searching for a different keyword or browse all categories.</p>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                setSearchInput("");
                handleCategorySelect("All");
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !isError && products.length > 0 && (
          <>
            <div className="shop-grid">
              {products.map((product) => {
                const mainImg = product.images?.[0]?.url || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80";
                const isSaved = isInWishlist(product._id);

                return (
                  <div key={product._id} className="product-card">
                    {/* Image wrap with fixed aspect ratio to prevent CLS */}
                    <div className="product-img-wrap">
                      <img
                        src={getOptimizedImageUrl(mainImg, { width: 500, height: 380, crop: "fill" })}
                        srcSet={getImageSrcSet(mainImg, [320, 480, 640])}
                        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        alt={product.images?.[0]?.alt || product.title}
                        loading="lazy"
                        width="500"
                        height="380"
                        className="product-card-img"
                      />

                      {product.badge && (
                        <span className="product-badge">{product.badge}</span>
                      )}

                      <button
                        type="button"
                        className={`product-wishlist-btn ${isSaved ? "saved" : ""}`}
                        onClick={() => toggleWishlist(product)}
                        aria-label={isSaved ? "Remove from saved" : "Save to wishlist"}
                      >
                        {isSaved ? "❤️" : "🤍"}
                      </button>
                    </div>

                    {/* Card details */}
                    <div className="product-card-body">
                      <div className="product-card-meta">
                        <span className="product-category-name">
                          {product.categoryId?.name || "Gurgaon Event"}
                        </span>
                        {product.ratingAvg > 0 && (
                          <span className="product-rating">
                            ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount || 1})
                          </span>
                        )}
                      </div>

                      <h3 className="product-card-title">
                        <Link to={`/p/${product.slug}`}>{product.title}</Link>
                      </h3>

                      <p className="product-card-desc">
                        {product.shortDescription || "Gurgaon on-site delivery and professional takedown included."}
                      </p>

                      <div className="product-card-footer">
                        <div className="product-price-block">
                          <span className="product-price-label">Starts at</span>
                          <span className="product-price">
                            {formatPaise(product.basePricePaise)}
                          </span>
                          {product.compareAtPricePaise > product.basePricePaise && (
                            <span className="product-compare-price">
                              {formatPaise(product.compareAtPricePaise)}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/p/${product.slug}`}
                          className="btn btn-gold product-btn"
                          aria-label={`Customize ${product.title}`}
                        >
                          Book Setup ➔
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="shop-pagination">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
