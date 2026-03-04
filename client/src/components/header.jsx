import { useState, useRef, useEffect } from "react";
import { IoMenuSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../store/slices/usersApiSlice";
import { logout } from "../store/slices/authSlice";
import { apiSlice } from "../store/slices/apiSlice";
import { cleanupLegacySessionStorage } from "../utils/cleanupLegacySessionStorage";
import "../sass/components/header.scss";

export default function Header() {
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get user info from the Redux store
  const { userInfo } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get the logout API mutation function
  const [logoutApiCall] = useLogoutMutation();

  const navBarExpandHandler = () => {
    setIsNavExpanded((prevIsNavExpanded) => !prevIsNavExpanded);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGOUT HANDLER ---
  const logoutHandler = async () => {
    try {
      setShowDropdown(false);
      // 1. Call the backend endpoint to clear the cookie
      await logoutApiCall().unwrap();
      cleanupLegacySessionStorage();
      // 2. Dispatch the logout action to clear frontend auth state
      dispatch(logout());
      // 3. Reset the API state to clear RTK Query cache
      dispatch(apiSlice.util.resetApiState());
      // 4. Navigate the user to the login page
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
          <>
            <li className={isNavExpanded ? "navbar__item navbar__item--nav" : "navbar__item navbar__item--nav expanded"}>
              <Link to="/leaderboard" className="navbar__item__link">
                Leaderboard
              </Link>
            </li>
            <li className={isNavExpanded ? "navbar__item navbar__item--nav" : "navbar__item navbar__item--nav expanded"}>
              <Link to="/home" className="navbar__item__link">
                Home
              </Link>
            </li>
            <li className={isNavExpanded ? "navbar__item navbar__item--nav" : "navbar__item navbar__item--nav expanded"}>
              <Link to="/level" className="navbar__item__link">
                Levels
              </Link>
            </li>
            
            {/* RIGHT MOST AVATAR DROPDOWN */}
            <li className="navbar__item navbar__item--avatar user-dropdown-container" ref={dropdownRef}>
              <div className="avatar-trigger" onClick={toggleDropdown}>
                <span className="header-avatar">{userInfo.avatar || '🐱'}</span>
              </div>
              
              {showDropdown && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Profile
                  </Link>
                  <div className="dropdown-divider"></div>
                  <a onClick={logoutHandler} className="dropdown-item" style={{ cursor: 'pointer' }}>
                    Logout
                  </a>
                </div>
              )}
            </li>
          </>
        ) : (
          <li className={isNavExpanded ? "navbar__item navbar__item--nav" : "navbar__item navbar__item--nav expanded"}>
            <Link to="/" className="navbar__item__link">
              Sign In
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
