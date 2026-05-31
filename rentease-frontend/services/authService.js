import api from "./api";
import { exportAgreementPdf } from "./pdfService";

export const loginUser = (data) => api.post("/auth/login/", data);
export const registerUser = (data) => api.post("/auth/register/", data);
export const getMe = () => api.get("/auth/me/");

export const getProperties = () => api.get("/properties/");
export const createProperty = (data) => api.post("/properties/", data);
export const updateProperty = (id, data) => api.patch(`/properties/${id}/`, data);
export const deleteProperty = (id) => api.delete(`/properties/${id}/`);

export const getAgreements = () => api.get("/agreements/");
export const createAgreement = (data) => api.post("/agreements/", data);
export const approveAgreement = (id) => api.post(`/agreements/${id}/approve/`);
export const rejectAgreement = (id) => api.post(`/agreements/${id}/reject/`);
export const negotiateAgreement = (id, data) => api.post(`/agreements/${id}/negotiate/`, data);
export const requestAgreement = (data) => createAgreement(data);

export const getPayments = () => api.get("/payments/");
export const createPayment = (data) => api.post("/payments/", data);
export const updatePayment = (id, data) => api.patch(`/payments/${id}/`, data);

export const getNotices = () => api.get("/notices/");
export const createNotice = (data) => api.post("/notices/", data);
export const exportAgreement = (data) => exportAgreementPdf(data);
export const getUsers = () => api.get("/auth/users/");