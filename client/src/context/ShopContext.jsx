import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ShopContext = createContext(null);

const WISHLIST_STORAGE_KEY = "decorjoy_wishlist_v3";

export function ShopProvider({ children }) {
  // 1. Wishlist / Saved Setups
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Modals & Drawers
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // 3. Toasts
  const [toast, setToast] = useState(null);

  // Sync wishlist to storage
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage", e);
    }
  }, [wishlist]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Wishlist operations
  const toggleWishlist = useCallback(
    (product) => {
      if (!product?._id && !product?.id) return;
      const pid = product._id || product.id;
      const exists = wishlist.some((item) => (item._id || item.id) === pid);

      if (exists) {
        setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== pid));
        showToast("Removed from saved setups", "info");
      } else {
        setWishlist((prev) => [...prev, product]);
        showToast(`Saved "${product.title || 'Setup'}" to your wishlist! ❤️`);
      }
    },
    [wishlist, showToast]
  );

  const isInWishlist = useCallback(
    (productId) => {
      return wishlist.some((item) => (item._id || item.id) === productId);
    },
    [wishlist]
  );

  const value = {
    // Wishlist
    wishlist,
    toggleWishlist,
    isInWishlist,
    isWishlistOpen,
    setIsWishlistOpen,

    // Quick View
    quickViewProduct,
    setQuickViewProduct,

    // Toast
    toast,
    showToast,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}

export default ShopContext;
