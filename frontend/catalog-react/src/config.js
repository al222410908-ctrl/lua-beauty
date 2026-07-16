const API_BASE = window.location.port === "8080" || window.location.protocol === "file:"
  ? "http://127.0.0.1:3000"
  : "";

export const CONFIG = {
  API_BASE_URL: API_BASE,
  WHATSAPP_NUMBER: "521234567890",
};

export const CATEGORY_STYLE = {
  rimels:    { label: "Rímels", color: "radial-gradient(circle at 32% 30%, #5a5048, #1c1814 70%)" },
  bases:     { label: "Bases", color: "radial-gradient(circle at 32% 30%, #f0c9a6, #c98f63 70%)" },
  skincare:  { label: "Skincare", color: "radial-gradient(circle at 32% 30%, #eef1e4, #b9c6a3 70%)" },
  labiales:  { label: "Labiales", color: "radial-gradient(circle at 32% 30%, #d97a63, #8c2f2a 70%)" },
  _default:  { label: "Otros", color: "radial-gradient(circle at 32% 30%, #ded2c2, #ab977f 70%)" },
};
