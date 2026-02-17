// src/services/api.js
const API_URL = "http://localhost:5000/api"; // Or import.meta.env.VITE_API_BASE_URL

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "API Error");
  return data;
};

const api = {
  // Exact match to your old code: GET /api/problem?username=...
  getProblem: (username) => request(`/problem?username=${username}`),

  // Exact match to your old code: POST /api/submit
  submitAnswer: (payload) =>
    request("/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Exact match to your old code: GET /api/status?username=...
  getUserStatus: (username) => request(`/status?username=${username}`),
};

export default api;

// const API_URL = 'http://localhost:5000/api';

// export const getProblem = async (username) => {
//   const res = await fetch(`${API_URL}/problem?username=${username}`);
//   return res.json();
// };

// export const submitAnswer = async (payload) => {
//   const res = await fetch(`${API_URL}/submit`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// };

// export const getStatus = async (username) => {
//   const res = await fetch(`${API_URL}/status?username=${username}`);
//   return res.json();
// };
