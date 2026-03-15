import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => api.post("/auth/register", data);

export const login = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

// ── Products ──────────────────────────────────────────────────────────────────
export const fetchProducts = () => api.get("/product");

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart = () => api.get("/cart");
export const addToCartAPI = (productId: string, quantity: number) =>
  api.post("/cart", { productId, quantity });
export const updateCartItemAPI = (productId: string, quantity: number) =>
  api.put(`/cart/${productId}`, { quantity });
export const removeCartItemAPI = (productId: string) =>
  api.delete(`/cart/${productId}`);
export const clearCartAPI = () => api.delete("/cart");

// ── Orders ────────────────────────────────────────────────────────────────────
export const placeOrder = (billingDetails: {
  firstName: string;
  lastName: string;
  email: string;
}) => api.post("/orders", { billingDetails });

export const getMyOrders = () => api.get("/orders/my");
