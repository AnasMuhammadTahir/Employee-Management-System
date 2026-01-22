import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Users, Building, Calendar, FileText, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    totalPayslips: 0,
    paidPayslips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      setError(null);

      // Total Employees
      const { count: employeeCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "employee");

      // Total Departments
      const { count: departmentCount } = await supabase
        .from("departments")
        .select("*", { count: "exact", head: true });

      // Leave counts
      const { count: totalLeaves } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true });

      const { count: pendingLeaves } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: approvedLeaves } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const { count: rejectedLeaves } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected");

      // Payslip counts
      const { count: totalPayslips } = await supabase
        .from("payslips")
        .select("*", { count: "exact", head: true });

      const { count: paidPayslips } = await supabase
        .from("payslips")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid");

      setStats({
        employees: employeeCount || 0,
        departments: departmentCount || 0,
        totalLeaves: totalLeaves || 0,
        pendingLeaves: pendingLeaves || 0,
        approvedLeaves: approvedLeaves || 0,
        rejectedLeaves: rejectedLeaves || 0,
        totalPayslips: totalPayslips || 0,
        paidPayslips: paidPayslips || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome to your StaffNet admin dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Employees"
            value={stats.employees}
            icon={<Users className="text-blue-600" size={24} />}
            bgColor="bg-blue-50"
            trend="+5%"
          />
          
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={<Building className="text-green-600" size={24} />}
            bgColor="bg-green-50"
          />
          
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon={<Calendar className="text-yellow-600" size={24} />}
            bgColor="bg-yellow-50"
            trend={`${stats.totalLeaves > 0 ? Math.round((stats.pendingLeaves / stats.totalLeaves) * 100) : 0}% of total`}
          />
          
          <StatCard
            title="Paid Payslips"
            value={stats.paidPayslips}
            icon={<DollarSign className="text-purple-600" size={24} />}
            bgColor="bg-purple-50"
            trend={`${stats.totalPayslips > 0 ? Math.round((stats.paidPayslips / stats.totalPayslips) * 100) : 0}% paid`}
          />
        </div>

        {/* Leave Statistics */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Leaves</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLeaves}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <FileText className="text-gray-600" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedLeaves}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedLeaves}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Calendar className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = "/admin/employees"}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Manage Employees</h3>
              <p className="text-sm text-gray-500 mt-1">Add, edit, or view employee profiles</p>
            </button>
            
            <button
              onClick={() => window.location.href = "/admin/leaves"}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Review Leave Requests</h3>
              <p className="text-sm text-gray-500 mt-1">{stats.pendingLeaves} pending requests</p>
            </button>
            
            <button
              onClick={() => window.location.href = "/admin/payslips"}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Process Payslips</h3>
              <p className="text-sm text-gray-500 mt-1">Generate and manage salary slips</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, trend }) {
  return (
    <div className={`${bgColor} rounded-lg shadow p-6 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-500">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        <div className="p-3 bg-white rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}