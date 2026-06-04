import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getZones = () => api.get("/zones").then((r) => r.data);
export const createCustomer = (data) => api.post("/customers", data).then((r) => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then((r) => r.data);
export const getCustomerOrders = (id) => api.get(`/customers/${id}/orders`).then((r) => r.data);

export const createOrder = (data) => api.post("/orders", data).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data).then((r) => r.data);
export const assignAgent = (orderId, agentId) => api.post(`/orders/${orderId}/assign`, { agent_id: agentId }).then((r) => r.data);
export const suggestAgent = (orderId) => api.get(`/orders/${orderId}/suggest-agent`).then((r) => r.data);

export const getAgents = () => api.get("/agents").then((r) => r.data);
export const createAgent = (data) => api.post("/agents", data).then((r) => r.data);
export const getAgentOrders = (id) => api.get(`/agents/${id}/orders`).then((r) => r.data);
export const updateAgentAvailability = (id, status) => api.patch(`/agents/${id}/availability`, { availability_status: status }).then((r) => r.data);

export const submitFeedback = (data) => api.post("/feedback", data).then((r) => r.data);
export const getFeedback = (orderId) => api.get(`/feedback/order/${orderId}`).then((r) => r.data);

export const getAnalyticsSummary = () => api.get("/analytics/summary").then((r) => r.data);
export const getZoneHeatmap = () => api.get("/analytics/zone-heatmap").then((r) => r.data);
export const getAgentLeaderboard = () => api.get("/analytics/agent-leaderboard").then((r) => r.data);
export const getPeakHours = () => api.get("/analytics/peak-hours").then((r) => r.data);
export const getSentimentBreakdown = () => api.get("/analytics/sentiment-breakdown").then((r) => r.data);
