import axios from "axios";

// Create Axios Instance with Base URL and cookie credentials
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor: attach custom X-Requested-With header on mutating requests
API.interceptors.request.use(
  (config) => {
    const mutatingMethods = ["post", "put", "patch", "delete"];
    if (mutatingMethods.includes(config.method?.toLowerCase())) {
      config.headers["X-Requested-With"] = "decorjoy";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: on 401 try /auth/refresh once, then redirect to /admin/login
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API.defaults.baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              "X-Requested-With": "decorjoy",
            },
          }
        );
        return API(originalRequest);
      } catch (refreshError) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/admin") &&
          window.location.pathname !== "/admin/login"
        ) {
          window.location.href = "/admin/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ================= ENRICHED PRODUCT CATALOG (With Color, Material, Gallery & Specs) =================
export const DEFAULT_SERVICES = [
  {
    _id: "s1",
    title: "Signature Ring Arch & Custom Neon",
    category: "Birthdays",
    startingPrice: 4499,
    isPopular: true,
    badge: "Most Popular",
    color: "Rose Gold",
    colorCode: "#d48b8b",
    material: "Organic Latex & Neon",
    setupTime: "90 Mins",
    bestFor: "Living Room / Backdrop",
    dimensions: "6ft Diameter Ring",
    rating: 4.9,
    reviewCount: 148,
    relatedIds: ["s2", "s3", "s5"],
    description:
      "Our #1 bestselling package across Gurgaon condos. A 6ft circular arch layered with 250+ organic chrome balloons, bespoke neon signage, and cake table styling.",
    included: [
      "250+ Premium metallic & pastel balloons",
      "6ft Golden circular backdrop frame",
      "Warm white LED neon sign ('Happy Birthday' / 'Cheers')",
      "2 Large foil number/star accents",
      "Free delivery & 100% on-time setup in Gurgaon",
    ],
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    _id: "s2",
    title: "Cozy Living Room Surprise",
    category: "Birthdays",
    startingPrice: 2499,
    isPopular: false,
    badge: "Best Value",
    color: "Pastel Multitone",
    colorCode: "#f3c68f",
    material: "Latex & Foil",
    setupTime: "45 Mins",
    bestFor: "Bedrooms & Intimate Rooms",
    dimensions: "Standard Room (Up to 15x15 ft)",
    rating: 4.8,
    reviewCount: 92,
    relatedIds: ["s1", "s3"],
    description:
      "Transform any Gurgaon apartment bedroom or living room into a celebration wonderland with zero mess or wall damage.",
    included: [
      "100 High-grade latex & metallic balloons",
      "Ceiling balloon canopy with curling ribbons",
      "Golden foil 'Happy Birthday' banner",
      "2 Fairy light strings (warm glow)",
      "Damage-free removable wall adhesives",
    ],
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    _id: "s3",
    title: "Romantic Candlelight & Cabana Experience",
    category: "Anniversaries",
    startingPrice: 5499,
    isPopular: true,
    badge: "Romantic Choice",
    color: "Warm White",
    colorCode: "#faf8f5",
    material: "Sheer Fabric & Lights",
    setupTime: "120 Mins",
    bestFor: "Terrace, Balcony or Suite",
    dimensions: "7x7 ft Cabana Canopy",
    rating: 5.0,
    reviewCount: 114,
    relatedIds: ["s5", "s1"],
    description:
      "An ethereal intimate setup featuring sheer white drapery canopy, 20 warm candle lanterns, fragrant rose petal aisle, and heart helium balloons.",
    included: [
      "Luxury white sheer fabric cabana structure",
      "Rose petal aisle + 20 glass candle votives",
      "Warm curtain fairy lights canopy",
      "Helium heart balloons & champagne table styling",
      "Personalized anniversary message card",
    ],
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    _id: "s4",
    title: "Dreamy Cloud Baby Shower & Welcome",
    category: "Baby Showers",
    startingPrice: 4999,
    isPopular: false,
    badge: "Newborn Special",
    color: "Sage Green",
    colorCode: "#84a98c",
    material: "Organic Latex & Neon",
    setupTime: "90 Mins",
    bestFor: "Home Hall / Clubhouse",
    dimensions: "8ft Arch with Pedestals",
    rating: 4.9,
    reviewCount: 78,
    relatedIds: ["s1", "s2"],
    description:
      "Soft pastel blue, cream, and blush organic balloon clouds with golden metallic pedestals, plush teddy bear installations, and 'Oh Baby' neon sign.",
    included: [
      "300+ Pastel cloud organic balloon garland",
      "Golden metallic display pedestals",
      "Glow LED 'Oh Baby' or 'Welcome Baby' neon sign",
      "Large plush teddy bear & cloud props",
      "Custom mom-to-be sash & photo frame",
    ],
    image:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    _id: "s5",
    title: "Grand 'Marry Me' Rooftop Proposal",
    category: "Proposals",
    startingPrice: 8499,
    isPopular: true,
    badge: "Luxury Pick",
    color: "Champagne Gold",
    colorCode: "#c59b27",
    material: "Marquee Lights & Florals",
    setupTime: "150 Mins",
    bestFor: "Rooftops & Private Decks",
    dimensions: "4ft Illuminated Letters + Runway",
    rating: 5.0,
    reviewCount: 63,
    relatedIds: ["s3", "s1"],
    description:
      "The definitive Gurgaon proposal experience. 4ft glowing illuminated 'MARRY ME' marquee letters, floral heart arch, glass candle walkway, and cold fire sparklers.",
    included: [
      "4ft Illuminated marquee 'MARRY ME' letters",
      "Grand floral heart arch with fairy lights",
      "Red rose petal runway with 40 glass lanterns",
      "2 Cold pyro sparkler machines for the moment",
      "Dedicated coordinator for timing execution",
    ],
    image:
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    _id: "s6",
    title: "Traditional Haldi & Mehndi Backdrop",
    category: "Special Celebrations",
    startingPrice: 7999,
    isPopular: false,
    badge: "Festive Exclusive",
    color: "Champagne Gold",
    colorCode: "#eab308",
    material: "Floral Marigold & Silk",
    setupTime: "120 Mins",
    bestFor: "Villas & Lawns",
    dimensions: "10x8 ft Fabric & Floral Frame",
    rating: 4.8,
    reviewCount: 54,
    relatedIds: ["s1", "s3"],
    description:
      "Bright yellow & orange marigold cascades paired with brass urli bowls, festive drapes, and traditional royal photography backdrop.",
    included: [
      "Fresh & artificial marigold flower cascades",
      "Golden brass urlis with floating candles",
      "Festive yellow & rani pink silk drapery",
      "Comfortable floor diwan mattress & bolster covers",
      "Takedown assistance available",
    ],
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
    ],
  },
];

export const DEFAULT_GALLERY = [
  {
    _id: "g1",
    title: "Rose Gold Ring Arch Setup",
    category: "Birthday",
    description: "Installed in The Crest, DLF Phase 5. Metallic chrome balloons with neon sign.",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    _id: "g2",
    title: "Terrace Cabana Candlelight Evening",
    category: "Anniversary",
    description: "Curtain fairy lights with warm glass lanterns in Nirvana Country.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
  },
  {
    _id: "g3",
    title: "Pastel Cloud Baby Shower Setup",
    category: "Baby Shower",
    description: "Organic cloud balloon garland with teddy bear in Sector 57 Gurugram.",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
  },
  {
    _id: "g4",
    title: "Rooftop 'Marry Me' Proposal",
    category: "Proposal",
    description: "Illuminated letters and red rose walkway on Golf Course Road.",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    _id: "g5",
    title: "25th Silver Jubilee Anniversary",
    category: "Anniversary",
    description: "Silver and white balloon canopy with photo memory wall in DLF Phase 2.",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80",
  },
  {
    _id: "g6",
    title: "Jungle Safari 1st Birthday Setup",
    category: "Birthday",
    description: "Custom animal cutouts and sage green balloon arch in Sohna Road.",
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80",
  },
];

export const DEFAULT_TESTIMONIALS = [
  {
    _id: "t1",
    clientName: "Pooja Malhotra",
    eventDate: "March 2026",
    eventType: "Birthday Surprise",
    rating: 5,
    location: "DLF Phase 5, Gurgaon",
    review:
      "Decor Joy made my husband's 30th birthday unforgettable! They arrived right on time, completed the setup in 90 minutes without making any mess, and the wall paint remained completely undamaged. 10/10 service!",
  },
  {
    _id: "t2",
    clientName: "Rohan & Simran",
    eventDate: "February 2026",
    eventType: "1st Anniversary Cabana",
    rating: 5,
    location: "Golf Course Road, Gurgaon",
    review:
      "The terrace cabana was like a fairytale movie setup. The warm fairy lights, candle lanterns, and rose petal pathway were beyond gorgeous. Booking on WhatsApp was super quick and transparent!",
  },
  {
    _id: "t3",
    clientName: "Kavita Singhal",
    eventDate: "January 2026",
    eventType: "Baby Shower",
    rating: 5,
    location: "Sector 57, Gurugram",
    review:
      "All our guests kept taking photos in front of the pastel cloud arch. Beautiful quality balloons that stayed inflated for 3 full days. Highly recommended for any event in Gurgaon.",
  },
];

// ================= AUTH API =================
export const loginAdmin = (credentials) => API.post("/auth/login", credentials);
export const refreshAuth = () => API.post("/auth/refresh");
export const logoutAdmin = () => API.post("/auth/logout");
export const getAdminProfile = () => API.get("/auth/me");

// ================= SERVICES API =================
export const getServices = async (category) => {
  try {
    const url = category && category !== "All" ? `/services?category=${encodeURIComponent(category)}` : "/services";
    const res = await API.get(url);
    const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (items.length > 0) {
      return {
        data: items.map((item, idx) => ({
          ...DEFAULT_SERVICES[idx % DEFAULT_SERVICES.length],
          ...item,
        })),
        pagination: res.data?.pagination,
      };
    }
    const filtered = category && category !== "All"
      ? DEFAULT_SERVICES.filter((s) => s.category.toLowerCase() === category.toLowerCase())
      : DEFAULT_SERVICES;
    return { data: filtered };
  } catch (err) {
    const filtered = category && category !== "All"
      ? DEFAULT_SERVICES.filter((s) => s.category.toLowerCase() === category.toLowerCase())
      : DEFAULT_SERVICES;
    return { data: filtered };
  }
};

export const getServiceById = async (id) => {
  try {
    const res = await API.get(`/services/${id}`);
    return res;
  } catch {
    const fallback = DEFAULT_SERVICES.find((s) => s._id === id) || DEFAULT_SERVICES[0];
    return { data: fallback };
  }
};

export const createService = (serviceData) => API.post("/services", serviceData);
export const updateService = (id, serviceData) => API.put(`/services/${id}`, serviceData);
export const deleteService = (id) => API.delete(`/services/${id}`);

// ================= GALLERY API =================
export const getGallery = async (category) => {
  try {
    const url = category && category !== "All" ? `/gallery?category=${encodeURIComponent(category)}` : "/gallery";
    const res = await API.get(url);
    const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (items.length > 0) {
      return { data: items, pagination: res.data?.pagination };
    }
    const filtered = category && category !== "All"
      ? DEFAULT_GALLERY.filter((g) => g.category.toLowerCase().includes(category.toLowerCase().slice(0, 4)))
      : DEFAULT_GALLERY;
    return { data: filtered };
  } catch (err) {
    const filtered = category && category !== "All"
      ? DEFAULT_GALLERY.filter((g) => g.category.toLowerCase().includes(category.toLowerCase().slice(0, 4)))
      : DEFAULT_GALLERY;
    return { data: filtered };
  }
};

export const getGalleryById = (id) => API.get(`/gallery/${id}`);
export const createGallery = (galleryData) => API.post("/gallery", galleryData);
export const updateGallery = (id, galleryData) => API.put(`/gallery/${id}`, galleryData);
export const deleteGallery = (id) => API.delete(`/gallery/${id}`);

// ================= INQUIRIES API =================
export const createInquiry = (inquiryData) => API.post("/inquiries", inquiryData);
export const getInquiries = async (status) => {
  const url = status && status !== "All" ? `/inquiries?status=${encodeURIComponent(status)}` : "/inquiries";
  const res = await API.get(url);
  const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
  return { ...res, data: items, pagination: res.data?.pagination };
};
export const updateInquiry = (id, inquiryData) => API.put(`/inquiries/${id}`, inquiryData);
export const deleteInquiry = (id) => API.delete(`/inquiries/${id}`);

// ================= TESTIMONIALS API =================
export const getTestimonials = async () => {
  try {
    const res = await API.get("/testimonials");
    const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (items.length > 0) {
      return { data: items, pagination: res.data?.pagination };
    }
    return { data: DEFAULT_TESTIMONIALS };
  } catch (err) {
    return { data: DEFAULT_TESTIMONIALS };
  }
};

export const createTestimonial = (testimonialData) => API.post("/testimonials", testimonialData);
export const updateTestimonial = (id, testimonialData) => API.put(`/testimonials/${id}`, testimonialData);
export const deleteTestimonial = (id) => API.delete(`/testimonials/${id}`);

// ================= PURPOSE FORMS & SUBMISSIONS API =================
export const getActivePurposes = () => API.get("/forms");
export const getPurposeForm = (formKey) => API.get(`/forms/${formKey}`);
export const submitPurposeForm = (formKey, submissionData) =>
  API.post(`/forms/${formKey}/submissions`, submissionData);

// Admin Form Builder API
export const getAdminForms = () => API.get("/admin/forms");
export const getAdminForm = (key) => API.get(`/admin/forms/${key}`);
export const createAdminForm = (formData) => API.post("/admin/forms", formData);
export const saveAdminForm = (key, formData) => API.put(`/admin/forms/${key}`, formData);
export const toggleAdminFormStatus = (key) => API.patch(`/admin/forms/${key}/status`);

// Admin Submissions API
export const getAdminSubmissions = (params) => API.get("/admin/submissions", { params });
export const getAdminSubmission = (id) => API.get(`/admin/submissions/${id}`);
export const updateAdminSubmissionStatus = (id, status) =>
  API.patch(`/admin/submissions/${id}/status`, { status });
export const addAdminSubmissionNote = (id, text) =>
  API.post(`/admin/submissions/${id}/notes`, { text });
export const assignAdminSubmission = (id, assignedTo) =>
  API.patch(`/admin/submissions/${id}/assign`, { assignedTo });
export const convertAdminSubmission = (id, orderId) =>
  API.post(`/admin/submissions/${id}/convert`, { orderId });

// ================= ADMIN V2 EXTENDED API =================

// Dashboard
export const getAdminDashboardStats = () => API.get("/admin/dashboard");

// Orders
export const getAdminOrders = (params) => API.get("/admin/orders", { params });
export const getAdminOrder = (id) => API.get(`/admin/orders/${id}`);
export const updateAdminOrderStatus = (id, status) => API.patch(`/admin/orders/${id}/status`, { status });
export const updateAdminOrderDetails = (id, data) => API.patch(`/admin/orders/${id}`, data);
export const refundAdminOrder = (id, data) => API.post(`/admin/orders/${id}/refund`, data);

// Products
export const getAdminProducts = (params) => API.get("/admin/products", { params });
export const getAdminProduct = (id) => API.get(`/admin/products/${id}`);
export const createAdminProduct = (data) => API.post("/admin/products", data);
export const updateAdminProduct = (id, data) => API.put(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) => API.delete(`/admin/products/${id}`);
export const restoreAdminProduct = (id) => API.post(`/admin/products/${id}/restore`);
export const duplicateAdminProduct = (id) => API.post(`/admin/products/${id}/duplicate`);
export const bulkUpdateProductStatus = (ids, isActive) => API.patch("/admin/products/bulk-status", { ids, isActive });
export const getUploadSignature = (folder) => API.post("/admin/uploads/signature", { folder });

// Categories & AddOns
export const getPublicCategories = () => API.get("/categories");
export const getPublicAddOns = () => API.get("/addons");
export const createAdminCategory = (data) => API.post("/admin/categories", data);
export const updateAdminCategory = (id, data) => API.put(`/admin/categories/${id}`, data);
export const deleteAdminCategory = (id) => API.delete(`/admin/categories/${id}`);
export const restoreAdminCategory = (id) => API.post(`/admin/categories/${id}/restore`);

export const createAdminAddOn = (data) => API.post("/admin/addons", data);
export const updateAdminAddOn = (id, data) => API.put(`/admin/addons/${id}`, data);
export const deleteAdminAddOn = (id) => API.delete(`/admin/addons/${id}`);
export const restoreAdminAddOn = (id) => API.post(`/admin/addons/${id}/restore`);

// Coupons
export const getAdminCoupons = (params) => API.get("/admin/coupons", { params });
export const createAdminCoupon = (data) => API.post("/admin/coupons", data);
export const updateAdminCoupon = (id, data) => API.put(`/admin/coupons/${id}`, data);
export const deleteAdminCoupon = (id) => API.delete(`/admin/coupons/${id}`);

// Settings
export const getAdminSettings = () => API.get("/admin/settings");
export const updateAdminSettings = (data) => API.patch("/admin/settings", data);
export const getPublicSettings = () => API.get("/settings/public");

// Users (Owner Only)
export const getAdminUsers = () => API.get("/admin/users");
export const inviteAdminUser = (data) => API.post("/admin/users/invite", data);
export const toggleAdminUserStatus = (id, isActive) => API.patch(`/admin/users/${id}/status`, { isActive });
export const resetAdminUserPassword = (id, newPassword) => API.post(`/admin/users/${id}/reset-password`, { newPassword });

// Audit Logs
export const getAdminAuditLogs = (params) => API.get("/admin/audit-logs", { params });

// Availability Management
export const getAdminAvailabilityMonth = (params) => API.get("/admin/availability/month", { params });
export const toggleAdminBlockDate = (date) => API.post("/admin/availability/toggle-block", { date });
export const updateAdminSlotCapacity = (slotKey, capacityPerDay) => API.patch("/admin/availability/slot-capacity", { slotKey, capacityPerDay });

export default API;
