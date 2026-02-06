import React from "react";
import Dashboard from "../components/Dashboard";
import { useGetUserStatusQuery } from "../store/slices/gameApiSlice";
import { useSelector } from "react-redux";

export default function Profile() {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username || "student1";

  const { data: status } = useGetUserStatusQuery(username);
  return (
    <>
      {/* --- RIGHT COLUMN: DASHBOARD --- */}
      <aside className="sidebar-section">
        <Dashboard status={status} />
      </aside>
      {/* </section> */}
    </>
  );
}
