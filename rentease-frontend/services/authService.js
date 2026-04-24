import api from "./api";

export const loginUser = (data) => api.post("/auth/login/", data);
export const registerUser = (data) => api.post("/auth/register/", data);

export const getProperties = () => api.get("/properties/");
export const createProperty = (data) => api.post("/properties/", data);
export const updateProperty = (id, data) => api.patch(`/properties/${id}/`, data);
export const deleteProperty = (id) => api.delete(`/properties/${id}/`);

export const getAgreements = () => api.get("/agreements/");
export const createAgreement = (data) => api.post("/agreements/", data);

export const getPayments = () => api.get("/payments/");
export const createPayment = (data) => api.post("/payments/", data);

export const getNotices = () => api.get("/notices/");
export const createNotice = (data) => api.post("/notices/", data);