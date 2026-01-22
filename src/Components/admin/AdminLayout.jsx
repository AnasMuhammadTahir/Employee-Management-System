import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { useState } from "react";
import { Menu, X, Home, Users, Building, Calendar, Settings, BarChart, FileText, LogOut } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    //clear your custom session data
    localStorage.removeItem("login_time");

    //clear everything auth-related
    localStorage.removeItem("supabase.auth.token");

    navigate("/login");
  };

  const linkClasses = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg text-lg transition ${
      isActive
        ? "bg-indigo-100 text-indigo-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* MOBILE FULLSCREEN DRAWER */}
      {open && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col lg:hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">StaffNet Admin</h2>
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={28} className="text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            <NavLink to="/admin" end className={linkClasses} onClick={() => setOpen(false)}>
              <Home size={20} className="mr-3" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/departments" className={linkClasses} onClick={() => setOpen(false)}>
              <Building size={20} className="mr-3" />
              Departments
            </NavLink>
            <NavLink to="/admin/employees" className={linkClasses} onClick={() => setOpen(false)}>
              <Users size={20} className="mr-3" />
              Employees
            </NavLink>
            <NavLink to="/admin/leaves" className={linkClasses} onClick={() => setOpen(false)}>
              <Calendar size={20} className="mr-3" />
              Leave Management
            </NavLink>
            <NavLink to="/admin/leave-balances" className={linkClasses} onClick={() => setOpen(false)}>
              <BarChart size={20} className="mr-3" />
              Leave Balances
            </NavLink>
            <NavLink to="/admin/payslips" className={linkClasses} onClick={() => setOpen(false)}>
              <FileText size={20} className="mr-3" />
              Payslips
            </NavLink>
            <NavLink to="/admin/settings" className={linkClasses} onClick={() => setOpen(false)}>
              <Settings size={20} className="mr-3" />
              Settings
            </NavLink>
          </nav>

          <div className="p-6 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white shadow-lg flex-col border-r">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">StaffNet</h2>
              <p className="text-sm text-gray-500">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-1 flex-1">
          <NavLink to="/admin" end className={linkClasses}>
            <Home size={20} className="mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/departments" className={linkClasses}>
            <Building size={20} className="mr-3" />
            Departments
          </NavLink>
          <NavLink to="/admin/employees" className={linkClasses}>
            <Users size={20} className="mr-3" />
            Employees
          </NavLink>
          <NavLink to="/admin/leaves" className={linkClasses}>
            <Calendar size={20} className="mr-3" />
            Leave Management
          </NavLink>
          <NavLink to="/admin/leave-balances" className={linkClasses}>
            <BarChart size={20} className="mr-3" />
            Leave Balances
          </NavLink>
          <NavLink to="/admin/payslips" className={linkClasses}>
            <FileText size={20} className="mr-3" />
            Payslips
          </NavLink>
          <NavLink to="/admin/settings" className={linkClasses}>
            <Settings size={20} className="mr-3" />
            Settings
          </NavLink>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <LogOut size={20} className="mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen">
        {/* MOBILE HEADER */}
        <div className="lg:hidden bg-white shadow-sm p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => setOpen(true)}>
                <Menu size={28} className="text-gray-700" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">StaffNet Admin</h2>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}