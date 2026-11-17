// Cliente mínimo de la API. El token vive en localStorage.
const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const KEY = "c27_token";

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  let res;
  try {
    res = await fetch(BASE + "/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    const err = new Error("No hay conexión con el backend. Revisa que esté corriendo en el puerto 3001.");
    err.status = 0;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.msg || "Algo falló (" + res.status + ")");
    err.status = res.status;
    throw err;
  }
  return data;
}
