import { useState } from "react";
import { IoMenuSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../store/slices/usersApiSlice";
import { logout } from "../store/slices/authSlice";
import "../sass/components/header.scss";

export default function Header() {
  const [isNavExpanded, setIsNavExpanded] = useState(true);

  // Get user info from the Redux store
  const { userInfo } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get the logout API mutation function
  const [logoutApiCall] = useLogoutMutation();

  const navBarExpandHandler = () => {
    setIsNavExpanded((prevIsNavExpanded) => !prevIsNavExpanded);
  };

  // --- LOGOUT HANDLER ---
  const logoutHandler = async () => {
    try {
      // 1. Call the backend endpoint to clear the cookie
      await logoutApiCall().unwrap();
      // 2. Dispatch the logout action to clear frontend state (localStorage)
      dispatch(logout());
      // 3. Navigate the user to the login page
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav id="navbarParent">
      <ul className={isNavExpanded ? "navbar" : "navbar expanded"}>
        <li className="navbar__item">
          <Link to={userInfo ? "/home" : "/"} className="navbar__item__title">
            Maths Wizard
          </Link>
          <div className="navbar__item__icon" onClick={navBarExpandHandler}>
            <IoMenuSharp />
          </div>
        </li>
        {userInfo ? (
          // If user is logged in, show Navigation, Profile and Logout links
          <>
            <li className={isNavExpanded ? "navbar__item" : "navbar__item expanded"}>
              <Link to="/home" className="navbar__item__link">
                Home
              </Link>
            </li>
            <li className={isNavExpanded ? "navbar__item" : "navbar__item expanded"}>
              <Link to="/level" className="navbar__item__link">
                Levels
              </Link>
            </li>
            <li className={isNavExpanded ? "navbar__item" : "navbar__item expanded"}>
              <Link to="/profile" className="navbar__item__link">
                Profile
              </Link>
            </li>
            <li className={isNavExpanded ? "navbar__item" : "navbar__item expanded"}>
              <div
                onClick={logoutHandler}
                className="navbar__item__link"
                style={{ cursor: "pointer" }}
              >
                Logout
              </div>
            </li>
          </>
        ) : (
          // If user is not logged in, show a Sign In link
          <li className={isNavExpanded ? "navbar__item" : "navbar__item expanded"}>
            <Link to="/" className="navbar__item__link">
              Sign In
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
