// src/store/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// 1. Create the empty split API
export const apiSlice = createApi({
  reducerPath: "api", // The key in the store
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  // 2. Define global tag types here so all injected files can use them
  tagTypes: ["UserStatus", "Problem", "User", "Leaderboard", "LeaderboardSettings"],

  // 3. Leave endpoints empty for code splitting
  endpoints: () => ({}),
});
