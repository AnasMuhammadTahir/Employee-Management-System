import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Users, FileText, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
    totalLeaves: 0,
    remainingDays: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Get employee profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create a basic one
        if (profileError.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              role: 'employee'
            })
            .select()
            .single();
          
          setProfile(newProfile);
        } else {
          throw profileError;
        }
      } else {
        setProfile(profileData);
      }

      // Get leave stats
      const { data: leaves, error: leavesError } = await supabase
        .from("leave_requests")
        .select("status, start_date, end_date, total_days")
        .eq("user_id", user.id);

      if (leavesError) {
        console.warn("Could not fetch leaves:", leavesError);
        // Continue without leave data
      }

      const counts = {
        approved: leaves?.filter(l => l.status === "approved").length || 0,
        pending: leaves?.filter(l => l.status === "pending").length || 0,
        rejected: leaves?.filter(l => l.status === "rejected").length || 0,
        totalLeaves: leaves?.length || 0,
        remainingDays: 0, // Default value
      };

      // Get leave balance
      const { data: leaveBalances, error: balanceError } = await supabase
        .from("leave_balances")
        .select("remaining_days")
        .eq("user_id", user.id);

      if (!balanceError && leaveBalances) {
        const remainingDays = leaveBalances.reduce((total, balance) => 
          total + (balance.remaining_days || 0), 0
        );
        counts.remainingDays = remainingDays;
      }

      // Get recent leaves (last 5)
      const { data: recentLeavesData, error: recentError } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!recentError) {
        setRecentLeaves(recentLeavesData || []);
      }

      setStats(counts);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <CheckCircle className="text-green-600" size={20} />;
      case "pending": return <Clock className="text-yellow-600" size={20} />;
      case "rejected": return <XCircle className="text-red-600" size={20} />;
      default: return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

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
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={loadDashboard}
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
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back{profile?.full_name && `, ${profile.full_name}`} 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Here's an overview of your activity and leave status
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate("/employee/leaves/apply")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply for Leave
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Leaves Taken"
            value={stats.totalLeaves}
            icon={<Calendar className="text-blue-600" size={24} />}
            bgColor="bg-blue-50"
            description="All time"
          />
          
          <StatCard
            title="Leave Days Remaining"
            value={stats.remainingDays}
            icon={<CheckCircle className="text-green-600" size={24} />}
            bgColor="bg-green-50"
            description="Available days"
          />
          
          <StatCard
            title="Pending Requests"
            value={stats.pending}
            icon={<Clock className="text-yellow-600" size={24} />}
            bgColor="bg-yellow-50"
            description="Awaiting approval"
          />
          
          <StatCard
            title="Approved Leaves"
            value={stats.approved}
            icon={<CheckCircle className="text-green-600" size={24} />}
            bgColor="bg-green-50"
            description="This year"
          />
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leave Requests</h2>
            <button
              onClick={() => navigate("/employee/leaves")}
              className="text-blue-600 hover:text-blue-800"
            >
              View All →
            </button>
          </div>
          
          {recentLeaves.length > 0 ? (
            <div className="space-y-4">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(leave.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {leave.total_days} day(s) • {leave.reason || "No reason provided"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                    leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {leave.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-900 font-medium">No leave requests yet</p>
              <p className="text-gray-600 mt-1">Apply for your first leave to get started</p>
              <button
                onClick={() => navigate("/employee/leaves/apply")}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply for Leave
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate("/employee/leaves/balance")}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md text-left transition-shadow"
          >
            <Calendar className="text-blue-600 mb-4" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">View Leave Balance</h3>
            <p className="text-sm text-gray-600">Check your available leave days and usage</p>
          </button>
          
          <button
            onClick={() => navigate("/employee/payslips")}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md text-left transition-shadow"
          >
            <FileText className="text-green-600 mb-4" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">View Payslips</h3>
            <p className="text-sm text-gray-600">Access and download your salary slips</p>
          </button>
          
          <button
            onClick={() => navigate("/employee/profile")}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md text-left transition-shadow"
          >
            <Users className="text-purple-600 mb-4" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Update Profile</h3>
            <p className="text-sm text-gray-600">Edit your personal information</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, description }) {
  return (
    <div className={`${bgColor} rounded-lg shadow p-6 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="p-3 bg-white rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}