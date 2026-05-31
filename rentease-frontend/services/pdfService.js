import axios from "axios";

const pdfApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_PDF_API_URL ||
    process.env.NEXT_PUBLIC_PDF_URL ||
    "http://127.0.0.1:8001",
});

export const exportAgreementPdf = (data) =>
  pdfApi.post("/generate-pdf", data, { responseType: "blob" });

export default pdfApi;