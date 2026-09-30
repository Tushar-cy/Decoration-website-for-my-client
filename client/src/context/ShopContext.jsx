import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuote } from "../services/api";
import { trackAddToCart } from "../utils/analytics";

const ShopContext = createContext(null);

const CART_STORAGE_KEY = "decorjoy_cart_v3";
const WISHLIST_STORAGE_KEY = "decorjoy_wishlist_v3";
const PINCODE_STORAGE_KEY = "decorjoy_pincode_v3";

export function ShopProvider({ children }) {
  // 1. Cart state: stores strictly { id, productId, variantSelections, addOnIds, quantity, date, slotKey, notes }
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Cleanse any legacy price tampering: only whitelist fields
      return Array.isArray(parsed)
        ? parsed.map((item) => ({
            id: item.id || `${item.productId}_${Date.now()}_${Math.random()}`,
            productId: item.productId || item._id,
            variantSelections: item.variantSelections || [],
            addOnIds: item.addOnIds || [],
            quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
            date: item.date || item.selectedDate || "",
            slotKey: item.slotKey || item.selectedSlot || "",
            notes: item.notes || "",
          }))
        : [];
    } catch {
      return [];
    }
  });

  // 2. Delivery Pincode
  const [pincode, setPincode] = useState(() => {
    try {
      return localStorage.getItem(PINCODE_STORAGE_KEY) || "122001";
    } catch {
      return "122001";
    }
  });

  // 3. Coupon code
  const [couponCode, setCouponCode] = useState("");

  // 4. Wishlist
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // 6. Toasts
  const [toast, setToast] = useState(null);

  // Sync cart to storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  // Sync wishlist to storage
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage", e);
    }
  }, [wishlist]);

  // Sync pincode to storage
  useEffect(() => {
    try {
      localStorage.setItem(PINCODE_STORAGE_KEY, pincode);
    } catch (e) {
      console.error("Failed to save pincode", e);
    }
  }, [pincode]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // 7. Server Quote via TanStack Query (Single Source of Truth for all prices)
  const quotePayload = useMemo(() => {
    if (cart.length === 0) return null;
    return {
      items: cart.map((item) => ({
        productId: item.productId,
        variantSelections: item.variantSelections,
        addOnIds: item.addOnIds,
        quantity: item.quantity,
      })),
      couponCode: couponCode ? couponCode.trim() : null,
      pincode: pincode ? pincode.trim() : null,
    };
  }, [cart, couponCode, pincode]);

  const {
    data: quoteData,
    isLoading: isQuoteLoading,
    isFetching: isQuoteFetching,
    error: quoteError,
    refetch: refetchQuote,
  } = useQuery({
    queryKey: ["cart-quote", quotePayload],
    queryFn: async () => {
      if (!quotePayload) return null;
      const res = await getQuote(quotePayload);
      return res.data?.data || null;
    },
    enabled: !!quotePayload && cart.length > 0,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Extract fix-it message if server returns product or slot errors
  const fixItMessage = useMemo(() => {
    if (!quoteError) return null;
    const msg = quoteError.response?.data?.message || quoteError.message;
    if (msg?.toLowerCase().includes("not found") || msg?.toLowerCase().includes("inactive")) {
      return "An item in your cart is no longer available. Please remove it to proceed with checkout.";
    }
    if (msg?.toLowerCase().includes("slot") || msg?.toLowerCase().includes("capacity")) {
      return "The selected slot is fully booked. Please select an alternate slot.";
    }
    return msg || "Unable to calculate pricing. Please review your bag.";
  }, [quoteError]);

  // Cart operations
  const addToCart = useCallback(
    ({ productId, variantSelections = [], addOnIds = [], quantity = 1, date = "", slotKey = "", notes = "", title = "Product" }) => {
      if (!productId) return;

      const variantKey = (variantSelections || []).map((v) => `${v.name}:${v.optionLabel}`).sort().join("|");
      const addOnKey = (addOnIds || []).slice().sort().join(",");
      const itemKey = `${productId}_${variantKey}_${addOnKey}_${date}_${slotKey}`;

      setCart((prev) => {
        const existingIdx = prev.findIndex((item) => item.id === itemKey);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
            notes: notes || updated[existingIdx].notes,
          };
          return updated;
        }

        return [
          ...prev,
          {
            id: itemKey,
            productId,
            variantSelections,
            addOnIds,
            quantity,
            date,
            slotKey,
            notes,
          },
        ];
      });

      showToast(`Added "${title}" to your celebration bag!`);
      trackAddToCart({ _id: productId, title, basePricePaise: 0 }, quantity);
      setIsCartOpen(true);
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (cartItemId) => {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      showToast("Item removed from your bag", "info");
    },
    [showToast]
  );

  const updateQuantity = useCallback((cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const updateItemSchedule = useCallback((cartItemId, { date, slotKey }) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, date: date ?? item.date, slotKey: slotKey ?? item.slotKey } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode("");
  }, []);

  // Coupon handling (driven by server quote)
  const applyCoupon = useCallback((code) => {
    setCouponCode((code || "").trim().toUpperCase());
  }, []);

  const removeCoupon = useCallback(() => {
    setCouponCode("");
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

  const cartCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Pricing from quote (Zero local price trust)
  const pricing = useMemo(() => {
    if (!quoteData?.pricing) {
      return {
        subtotalPaise: 0,
        discountPaise: 0,
        deliveryFeePaise: 0,
        totalPaise: 0,
        advanceDuePaise: 0,
        advancePercent: 25,
      };
    }
    return quoteData.pricing;
  }, [quoteData]);

  const quoteItems = useMemo(() => {
    return quoteData?.items || [];
  }, [quoteData]);

  const couponResult = useMemo(() => {
    return quoteData?.coupon || { valid: false, discountPaise: 0 };
  }, [quoteData]);

  const value = {
    cart,
    cartCount,
    quote: quoteData,
    quoteItems,
    pricing,
    couponResult,
    couponCode,
    applyCoupon,
    removeCoupon,
    pincode,
    setPincode,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemSchedule,
    clearCart,
    refetchQuote,
    isQuoteLoading,
    isQuoteFetching,
    quoteError,
    fixItMessage,
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
