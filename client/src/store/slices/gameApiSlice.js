// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import api from "../../services/api";

// // 1. Fetch Question (Only needs username, NO conceptId)
// export const fetchQuestion = createAsyncThunk(
//   "game/fetchQuestion",
//   async (username, { rejectWithValue }) => {
//     try {
//       return await api.getProblem(username);
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   },
// );

// // 2. Submit Answer
// export const submitUserAnswer = createAsyncThunk(
//   "game/submitAnswer",
//   async (payload, { rejectWithValue }) => {
//     try {
//       return await api.submitAnswer(payload);
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   },
// );

// // 3. Fetch Status
// export const fetchUserStatus = createAsyncThunk(
//   "game/fetchUserStatus",
//   async (username, { rejectWithValue }) => {
//     try {
//       return await api.getUserStatus(username);
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   },
// );

// const gameSlice = createSlice({
//   name: "game",
//   initialState: {
//     currentQuestion: null, // Stores the 'question' object from backend
//     userStatus: null,
//     status: "idle",
//     error: null,
//     feedback: null,
//   },
//   reducers: {
//     resetFeedback: (state) => {
//       state.feedback = null;
//       state.status = "idle";
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch Question
//       .addCase(fetchQuestion.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(fetchQuestion.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         // Your old code returned { question: ..., concept: ... }
//         // We save the whole object or just the question part depending on your backend
//         state.currentQuestion = action.payload;
//       })
//       .addCase(fetchQuestion.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
//       // Submit Answer
//       .addCase(submitUserAnswer.fulfilled, (state, action) => {
//         state.feedback = action.payload;
//       })
//       // Fetch Status
//       .addCase(fetchUserStatus.fulfilled, (state, action) => {
//         state.userStatus = action.payload;
//       });
//   },
// });

// export const { resetFeedback } = gameSlice.actions;
// export default gameSlice.reducer;

import { apiSlice } from "./apiSlice"; // Import the motherboard

// 1. Inject endpoints into the parent API
export const gameApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- GAME ROUTES ---
    getProblem: builder.query({
      query: (username) => `/problem?username=${username}`,
      providesTags: ["Problem"],
    }),

    getUserStatus: builder.query({
      query: (username) => `/status?username=${username}`,
      providesTags: ["UserStatus"],
    }),

    submitAnswer: builder.mutation({
      query: (payload) => ({
        url: "/submit",
        method: "POST",
        body: payload,
      }),
      // Magic: Refresh UserStatus when an answer is submitted
      invalidatesTags: ["UserStatus"],
    }),
  }),
  overrideExisting: false, // Prevent errors in hot-reloading
});

// 2. Export the auto-generated hooks
export const {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} = gameApiSlice;
