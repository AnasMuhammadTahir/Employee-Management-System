import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient.js";

export default function EmployeeLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate("/");
    };

    const linkClasses = ({ isActive }) =>
  `block px-4 py-2 rounded-lg transition ${
    isActive
      ? "bg-indigo-100 text-gray-800"
      : "text-gray-800 hover:bg-gray-700 hover:text-white"
  }`;

  return (
    
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 text-xl font-bold">
          EMS Lite
        </div>

        <nav className="px-4 space-y-2 flex-1">
          <NavLink
            to="/employee"
            end
            className={linkClasses}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/employee/profile"
            className={linkClasses}
          >
            My Profile
          </NavLink>

          <NavLink
            to="/employee/leaves"
            className={linkClasses}
          >
            Leaves
          </NavLink>

          <NavLink
            to="/employee/salary"
            className={linkClasses}
          >
            Salary
          </NavLink>
        </nav>

        <button
          onClick={handleLogout}
          className="m-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </aside>

    
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
    
  );
}
