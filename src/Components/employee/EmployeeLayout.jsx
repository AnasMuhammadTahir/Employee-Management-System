import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("login_time");
    navigate("/");
  };

  const linkClasses = ({ isActive }) =>
    `block px-4 py-3 rounded-lg text-lg transition ${
      isActive
        ? "bg-indigo-100 text-gray-900"
        : "text-gray-700 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* MOBILE FULLSCREEN DRAWER */}
      {open && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col lg:hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold">StaffNet</h2>
            <button onClick={() => setOpen(false)}>
              <X size={28} />
            </button>
          </div>

          <nav className="flex-1 px-6 py-4 space-y-2">
            <NavLink to="/employee" end className={linkClasses} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/employee/profile" className={linkClasses} onClick={() => setOpen(false)}>
              My Profile
            </NavLink>
            <NavLink to="/employee/leaves" className={linkClasses} onClick={() => setOpen(false)}>
              Leave Management
            </NavLink>
            <NavLink to="/employee/settings" className={linkClasses} onClick={() => setOpen(false)}>
              Settings
            </NavLink>
          </nav>

          <button
            onClick={handleLogout}
            className="m-6 bg-red-500 text-white py-3 rounded-lg text-lg"
          >
            Logout
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white shadow-md flex-col">
        <div className="p-6 text-xl font-bold">StaffNet</div>

        <nav className="px-4 space-y-2 flex-1">
          <NavLink to="/employee" end className={linkClasses}>
            Dashboard
          </NavLink>
          <NavLink to="/employee/profile" className={linkClasses}>
            My Profile
          </NavLink>
          <NavLink to="/employee/leaves" className={linkClasses}>
            Leaves
          </NavLink>
          <NavLink to="/employee/settings" className={linkClasses}>
            Settings
          </NavLink>
        </nav>

        <button
          onClick={handleLogout}
          className="m-4 bg-red-500 text-white py-2 rounded-lg"
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="lg:hidden mb-4">
          <button onClick={() => setOpen(true)}>
            <Menu size={28} />
          </button>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
