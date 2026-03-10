import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import Profile from "./pages/Profile.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";

import store from "./store/store.js";
import { Provider } from "react-redux";

import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

const route = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index={true} element={<Login />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="" element={<PrivateRoute />}>
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
    </Route>,
  ),
);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <RouterProvider router={route}></RouterProvider>
    </StrictMode>
  </Provider>,
);
