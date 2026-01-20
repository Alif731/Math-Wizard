import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/home.jsx";

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
    <Route>
      <Route path="/home" element={<Home />}></Route>
      <Route index element={<Login />}></Route>
    </Route>,
  ),
);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <RouterProvider router={route}></RouterProvider>
      <App />
    </StrictMode>
    ,
  </Provider>,
);
