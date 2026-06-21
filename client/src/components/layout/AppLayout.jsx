import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import MobileNav from "./MobileNav.jsx";
import { closeMobileNav } from "../../app/uiSlice.js";

export default function AppLayout() {
  const location = useLocation();
  const dispatch = useDispatch();

  // Close the mobile drawer automatically whenever the route changes.
  useEffect(() => {
    dispatch(closeMobileNav());
  }, [location.pathname, dispatch]);

  return (
    <div className="flex h-screen bg-lab">
      <Sidebar />
      <MobileNav />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
