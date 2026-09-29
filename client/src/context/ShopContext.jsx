import React, { createContext, useContext, useState, useEffect } from "react";

const ShopContext = createContext(null);

const CART_STORAGE_KEY = "decorjoy_cart_v2";
const WISHLIST_STORAGE_KEY = "decorjoy_wishlist_v2";

export function ShopProvider({ children }) {
  // 1. Cart State with localStorage persistence
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Wishlist State with localStorage persistence
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. UI Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // 4. Toast notifications
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage", e);
    }
  }, [wishlist]);

  const showToast = (message, type = "success") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Cart operations
  const addToCart = (product, options = {}) => {
    const cartItemId = options.customId || product._id;
    const price = options.price || product.startingPrice || 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + (options.quantity || 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          price,
          quantity: options.quantity || 1,
          selectedDate: options.date || "",
          selectedSlot: options.slot || "Evening (4 PM - 7 PM)",
          selectedColor: options.color || product.color || "Standard",
          notes: options.notes || "",
        },
      ];
    });

    showToast(`Added "${product.title}" to your celebration bag!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed from your bag", "info");
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Wishlist operations
  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item._id === product._id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item._id !== product._id));
      showToast(`Removed from saved setups`, "info");
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast(`Saved "${product.title}" to your wishlist! ❤️`);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  return (
    <ShopContext.Provider
      value={{
        cart,
        cartTotal,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        quickViewProduct,
        setQuickViewProduct,
        toast,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}

export default ShopContext;
