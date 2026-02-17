import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import SelectionLevel from "./pages/SelectionLevel.jsx";
import Profile from "./pages/Profile.jsx";

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
      <Route index={true} element={<Login />}></Route>
      <Route path="/home" element={<Home />}></Route>
      <Route path="/level" element={<SelectionLevel />}></Route>
      <Route path="/profile" element={<Profile />}></Route>
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
