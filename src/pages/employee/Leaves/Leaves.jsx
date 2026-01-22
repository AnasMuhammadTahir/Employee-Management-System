import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../supabaseClient";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  TrendingUp,
  CalendarDays,
  AlertCircle,
  Filter,
  Download
} from "lucide-react";

export default function EmployeeLeaves() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsed: 0,
    available: 0,
    pending: 0,
    approved: 0
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch employee ID
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;

      // Fetch leave balances for current year
      const currentYear = new Date().getFullYear();
      const { data: balances } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_types (name, is_paid, max_days)
        `)
        .eq("employee_id", employee.id)
        .eq("year", currentYear);

      setLeaveBalances(balances || []);

      // Calculate stats
      if (balances) {
        const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
        const available = balances.reduce((sum, b) => sum + b.remaining, 0);
        setStats({ totalUsed, available });
      }

      // Fetch leave history
      const { data: leaveHistory } = await supabase
        .from("leaves")
        .select(`
          *,
          leave_types (name),
          approved_by,
          approved_at
        `)
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

      setLeaves(leaveHistory || []);

      // Update pending/approved counts
      if (leaveHistory) {
        const pending = leaveHistory.filter(l => l.status === "pending").length;
        const approved = leaveHistory.filter(l => l.status === "approved").length;
        setStats(prev => ({ ...prev, pending, approved }));
      }

    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
      approved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
      rejected: { color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: <AlertCircle className="w-4 h-4" /> }
    };
    
    const { color, icon } = config[status] || config.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${color}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  async function cancelLeave(leaveId) {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;

    const { error } = await supabase
      .from("leaves")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", leaveId);

    if (error) {
      alert("Failed to cancel leave: " + error.message);
      return;
    }

    fetchData();
  }

  function getFilteredLeaves() {
    if (filter === "all") return leaves;
    return leaves.filter(leave => leave.status === filter);
  }

  function exportLeavesToCSV() {
    const headers = ["Leave Type", "Start Date", "End Date", "Total Days", "Status", "Reason"];
    const csvData = leaves.map(leave => [
      leave.leave_types?.name,
      formatDate(leave.start_date),
      formatDate(leave.end_date),
      leave.total_days,
      leave.status,
      leave.reason || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-leaves-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leaves</h1>
          <p className="text-gray-600 mt-2">Manage your leave requests and balances</p>
        </div>
        <button
          onClick={() => navigate("/employee/leaves/apply")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Used</p>
              <p className="text-2xl font-bold mt-2">{stats.totalUsed} days</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold mt-2">{stats.available} days</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold mt-2">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold mt-2">{stats.approved}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Leave Balances */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Leave Balances</h2>
            <div className="space-y-4">
              {leaveBalances.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No leave balances found</p>
              ) : (
                leaveBalances.map((balance) => (
                  <div key={balance.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{balance.leave_types?.name}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        balance.leave_types?.is_paid 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {balance.leave_types?.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Allocated</span>
                        <span className="font-medium">{balance.total_allocated} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Used</span>
                        <span className="font-medium text-red-600">{balance.used} days</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-700">Remaining</span>
                        <span className="text-green-600">{balance.remaining} days</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((balance.used / balance.total_allocated) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {Math.round((balance.used / balance.total_allocated) * 100)}% used
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Leave History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Leave History</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={exportLeavesToCSV}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Leave List */}
            <div className="divide-y divide-gray-200">
              {getFilteredLeaves().length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No leave requests found</p>
                  <button
                    onClick={() => navigate("/employee/leaves/apply")}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    Apply for your first leave →
                  </button>
                </div>
              ) : (
                getFilteredLeaves().map((leave) => (
                  <div key={leave.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{leave.leave_types?.name}</h3>
                          {getStatusBadge(leave.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {leave.reason && (
                          <p className="text-gray-700 mb-3">{leave.reason}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          Applied on {new Date(leave.created_at).toLocaleDateString()}
                          {leave.approved_at && (
                            <span className="ml-4">
                              • Approved on {new Date(leave.approved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {leave.status === "pending" && (
                          <button
                            onClick={() => cancelLeave(leave.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel Request
                          </button>
                        )}
                        {leave.status === "approved" && new Date(leave.start_date) > new Date() && (
                          <button
                            onClick={() => cancelLeave(leave.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel Leave
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons for Approved Leaves */}
                    {leave.status === "approved" && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Approved</span>
                            {leave.approved_at && (
                              <span className="text-gray-500">
                                on {new Date(leave.approved_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              // Add functionality to download leave approval letter
                              alert("Download feature coming soon!");
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Download Approval
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {leave.status === "rejected" && leave.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">Rejection Reason</p>
                            <p className="text-red-700 text-sm mt-1">{leave.rejection_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}