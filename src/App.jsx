import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./Components/ProtectedRoute";
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

import ApplyLeave from "./pages/employee/Leaves/ApplyLeave";

import EmployeeLayout from "./Components/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyProfile from "./pages/employee/MyProfile";
import EmployeeLeaves from "./pages/employee/Leaves/Leaves";
import Salary from "./pages/employee/Salary";
import EditProfileRequest from "./pages/employee/EditProfileRequest";
import ProfileEditRequests from "./pages/admin/ProfileEditRequests";


export default function App() {
  return (
    
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* 🔒 Admin */}
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

          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="/admin/profile-requests" element={<ProfileEditRequests />} />
          <Route
              path="/admin/employees/:id/edit"
              element={
                <ProtectedRoute role="admin">
                  <EditEmployee />
                </ProtectedRoute>
              }
            />

        </Route>
      </Route>
      
      {/* 🔒 Employee */}

        <Route path="/employee" element={<ProtectedRoute role="employee" />}>
        <Route path="leaves/apply" element={<ApplyLeave />} />
      </Route>
      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="leaves" element={<EmployeeLeaves />} />
        <Route path="salary" element={<Salary />} />
        <Route path="profile/edit-request" element={<EditProfileRequest />} />

      </Route>

    </Routes>
    
  )
}
