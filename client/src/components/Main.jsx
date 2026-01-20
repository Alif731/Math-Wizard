import { Outlet } from "react-router-dom";
import "../sass/style.scss";

const Main = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

export default Main;
