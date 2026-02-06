import React from "react";
import "../sass/page/selectionLevel.scss";

import { useSelector } from "react-redux";
import { useGetUserStatusQuery } from "../store/slices/gameApiSlice";

export default function SelectionLevel() {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username || "student1";
  const { data: status } = useGetUserStatusQuery(username);

  return (
    <>
      <header className="game-header">
        {/* <div className="zpd__text">
          <strong className="zpd-title">
            {status?.zpdNodes?.join(", ") || "Analyzing..."}:
          </strong>
          ZP <span className="highlight">D </span> Level
        </div> */}
        <div className="player-badge highlight2">
          <span className="highlight1">H</span>i there
          <strong style={{ marginLeft: "0.4rem" }}>
            {" "}
            {username}. Let's Continue this Journey!
          </strong>
        </div>
      </header>
      <div className="selection">
        <div className="selection__design">Foundational </div>
        <div className="selection__design">Word Problems </div>
        <div></div>
      </div>
    </>
  );
}
