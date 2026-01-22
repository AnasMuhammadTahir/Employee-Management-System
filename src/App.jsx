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
import EmployeeView from "./pages/admin/EmployeeView";
import EmployeeSalary from "./pages/admin/EmployeeSalary";
import EditEmployee from "./pages/admin/EditEmployee";
import AdminLeaves from "./pages/admin/AdminLeaves";
import Payroll from "./pages/admin/Payroll";
import ProcessPayroll from "./pages/admin/ProcessPayroll";
import PayrollDetails from "./pages/admin/PayrollDetails";
import LeaveTypes from "./pages/admin/LeaveTypes";
import LeaveBalances from "./pages/admin/LeaveBalances";
import AdminPayslips from "./pages/admin/AdminPayslips"; 
import Reports from "./pages/admin/Reports";

// Employee
import EmployeeLayout from "./Components/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyProfile from "./pages/employee/MyProfile";
import EmployeeLeaves from "./pages/employee/Leaves/Leaves";
import ApplyLeave from "./pages/employee/Leaves/ApplyLeave";
import LeaveBalance from "./pages/employee/Leaves/LeaveBalance";
import Salary from "./pages/employee/Salary";
import Payslips from "./pages/employee/Payslips";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* 🔒 Admin Routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          
          <Route path="departments" element={<Departments />} />
          <Route path="departments/new" element={<AddDepartment />} />
          <Route path="departments/:id/edit" element={<EditDepartment />} />
          
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeView />} />
          <Route path="employees/:id/salary" element={<EmployeeSalary />} />
          <Route path="employees/:id/edit" element={<EditEmployee />} />
          
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="leave-types" element={<LeaveTypes />} />
          <Route path="leave-balances" element={<LeaveBalances />} />
          
          <Route path="payroll" element={<Payroll />} />
          <Route path="payroll/process" element={<ProcessPayroll />} />
          <Route path="payroll/:id" element={<PayrollDetails />} />
          
          <Route path="payslips" element={<AdminPayslips />} /> 
          
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* 🔒 Employee Routes */}
      <Route element={<ProtectedRoute role="employee" />}>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="leaves/apply" element={<ApplyLeave />} />
          <Route path="leaves/balance" element={<LeaveBalance />} />
          <Route path="salary" element={<Salary />} />
          <Route path="payslips" element={<Payslips />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}