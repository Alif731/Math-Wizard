// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// // Define the API Service
// export const apiSlice = createApi({
//   reducerPath: 'api', // The name in the store
//   baseQuery: fetchBaseQuery({
//     baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
//   }),
//   tagTypes: ['UserStatus', 'Problem'], // Tags for Cache Invalidation

//   endpoints: (builder) => ({

//     // 1. GET PROBLEM
//     getProblem: builder.query({
//       query: (username) => `/problem?username=${username}`,
//       providesTags: ['Problem'], // Mark this data with 'Problem' tag
//     }),

//     // 2. GET STATUS
//     getUserStatus: builder.query({
//       query: (username) => `/status?username=${username}`,
//       providesTags: ['UserStatus'], // Mark this data with 'UserStatus' tag
//     }),

//     // 3. SUBMIT ANSWER
//     submitAnswer: builder.mutation({
//       query: (payload) => ({
//         url: '/submit',
//         method: 'POST',
//         body: payload,
//       }),
//       // AUTOMATIC REFRESH MAGIC:
//       // When this mutation succeeds, Redux will automatically re-fetch
//       // any query providing the 'UserStatus' tag.
//       invalidatesTags: ['UserStatus'],
//     }),

//   }),
// });

// // Export the Auto-Generated Hooks
// export const {
//   useGetProblemQuery,
//   useGetUserStatusQuery,
//   useSubmitAnswerMutation
// } = apiSlice;

// src/store/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// 1. Create the empty split API
export const apiSlice = createApi({
  reducerPath: "api", // The key in the store
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  }),
  // 2. Define global tag types here so all injected files can use them
  tagTypes: ["UserStatus", "Problem"],

  // 3. Leave endpoints empty for code splitting
  endpoints: () => ({}),
});
