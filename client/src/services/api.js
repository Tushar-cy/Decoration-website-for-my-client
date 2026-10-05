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

// ================= AUTH API =================
export const loginAdmin = (credentials) => API.post("/auth/login", credentials);
export const refreshAuth = () => API.post("/auth/refresh");
export const logoutAdmin = () => API.post("/auth/logout");
export const getAdminProfile = () => API.get("/auth/me");

// ================= PUBLIC PRODUCTS & CATALOG API =================
export const getPublicProducts = (params) => API.get("/products", { params });
export const getProductBySlug = (slug) => API.get(`/products/${encodeURIComponent(slug)}`);
export const getPublicCategories = () => API.get("/categories");
export const getPublicAddOns = () => API.get("/addons");

// Legacy alias pointing to real products API (Zero fallbacks)
export const getServices = async (category) => {
  const params = {};
  if (category && category !== "All") params.category = category;
  const res = await API.get("/products", { params });
  return {
    data: res.data?.data?.products || [],
    pagination: res.data?.data?.pagination,
  };
};

export const getServiceById = async (id) => {
  return API.get(`/products/${id}`);
};


// ================= GALLERY API (Zero fallbacks) =================
export const getGallery = (category) => {
  const params = category && category !== "All" ? { category } : {};
  return API.get("/gallery", { params });
};
export const getGalleryById = (id) => API.get(`/gallery/${id}`);
export const createGallery = (galleryData) => API.post("/gallery", galleryData);
export const updateGallery = (id, galleryData) => API.put(`/gallery/${id}`, galleryData);
export const deleteGallery = (id) => API.delete(`/gallery/${id}`);

// ================= TESTIMONIALS API (Zero fallbacks) =================
export const getTestimonials = () => API.get("/testimonials");
export const createTestimonial = (testimonialData) => API.post("/testimonials", testimonialData);
export const updateTestimonial = (id, testimonialData) => API.put(`/testimonials/${id}`, testimonialData);
export const deleteTestimonial = (id) => API.delete(`/testimonials/${id}`);

// ================= INQUIRIES API =================
export const createInquiry = (inquiryData) => API.post("/inquiries", inquiryData);
export const getInquiries = (status) => {
  const params = status && status !== "All" ? { status } : {};
  return API.get("/inquiries", { params });
};
export const updateInquiry = (id, inquiryData) => API.put(`/inquiries/${id}`, inquiryData);
export const deleteInquiry = (id) => API.delete(`/inquiries/${id}`);

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
export const convertAdminSubmission = (id, data = {}) =>
  API.post(`/admin/submissions/${id}/convert`, typeof data === "string" ? { orderId: data } : data);

// ================= ADMIN V2 EXTENDED API =================

// Dashboard
export const getAdminDashboardStats = () => API.get("/admin/dashboard");


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
export const createAdminCategory = (data) => API.post("/admin/categories", data);
export const updateAdminCategory = (id, data) => API.put(`/admin/categories/${id}`, data);
export const deleteAdminCategory = (id) => API.delete(`/admin/categories/${id}`);
export const restoreAdminCategory = (id) => API.post(`/admin/categories/${id}/restore`);

export const createAdminAddOn = (data) => API.post("/admin/addons", data);
export const updateAdminAddOn = (id, data) => API.put(`/admin/addons/${id}`, data);
export const deleteAdminAddOn = (id) => API.delete(`/admin/addons/${id}`);
export const restoreAdminAddOn = (id) => API.post(`/admin/addons/${id}/restore`);


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


// Admin Gallery (TanStack Query aware — includes inactive)
export const getAdminGallery = (params) => API.get("/admin/gallery", { params });
export const createAdminGallery = (data) => API.post("/admin/gallery", data);
export const updateAdminGallery = (id, data) => API.put(`/admin/gallery/${id}`, data);
export const deleteAdminGallery = (id) => API.delete(`/admin/gallery/${id}`);
export const toggleAdminGalleryActive = (id) => API.patch(`/admin/gallery/${id}/toggle-active`);
export const toggleAdminGalleryFeatured = (id) => API.patch(`/admin/gallery/${id}/toggle-featured`);
export const bulkUploadAdminGallery = (items) => API.post("/admin/gallery/bulk", { items });

// Admin Testimonials (TanStack Query aware — includes inactive)
export const getAdminTestimonials = (params) => API.get("/admin/testimonials", { params });
export const createAdminTestimonial = (data) => API.post("/admin/testimonials", data);
export const updateAdminTestimonial = (id, data) => API.put(`/admin/testimonials/${id}`, data);
export const deleteAdminTestimonial = (id) => API.delete(`/admin/testimonials/${id}`);
export const toggleAdminTestimonialActive = (id) => API.patch(`/admin/testimonials/${id}/toggle-active`);

export default API;
