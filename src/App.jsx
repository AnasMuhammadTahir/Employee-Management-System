import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";

import ProtectedRoute from "./Components/ProtectedRoute";

// Admin
import AdminLayout from "./Components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Departments from "./pages/admin/Departments";
import AddDepartment from "./pages/admin/AddDepartment";
import EditDepartment from "./pages/admin/EditDepartment";
import Employees from "./pages/admin/Employees";
import AddEmployee from "./pages/admin/AddEmployee";
import EmployeeView from "./pages/admin/EmployeeView";
import EmployeeSalary from "./pages/admin/EmployeeSalary";
import EditEmployee from "./pages/admin/EditEmployee";
import AdminLeaves from "./pages/admin/AdminLeaves";

// Employee
import EmployeeLayout from "./Components/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyProfile from "./pages/employee/MyProfile";
import EmployeeLeaves from "./pages/employee/Leaves/Leaves";
import ApplyLeave from "./pages/employee/Leaves/ApplyLeave";
import Salary from "./pages/employee/Salary";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* 🔒 Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />

          <Route path="departments" element={<Departments />} />
          <Route path="departments/new" element={<AddDepartment />} />
          <Route path="departments/:id/edit" element={<EditDepartment />} />

          <Route path="employees" element={<Employees />} />
          <Route path="employees/new" element={<AddEmployee />} />
          <Route path="employees/:id" element={<EmployeeView />} />
          <Route path="employees/:id/salary" element={<EmployeeSalary />} />
          <Route path="employees/:id/edit" element={<EditEmployee />} />

          <Route path="leaves" element={<AdminLeaves />} />
        </Route>
      </Route>

      {/* 🔒 Employee Routes */}
      <Route path="/employee" element={<ProtectedRoute role="employee" />}>
        <Route element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="leaves/apply" element={<ApplyLeave />} />
          <Route path="salary" element={<Salary />} />
        </Route>
      </Route>
    </Routes>
  );
}
