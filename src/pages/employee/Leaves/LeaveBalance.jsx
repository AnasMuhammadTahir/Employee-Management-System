import { useState, useEffect } from "react";
import { supabase } from "../../../../supabaseClient";

export default function LeaveBalance() {
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchLeaveData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUser(profile);
    }
  };

  const fetchLeaveData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch leave types
      const { data: typesData, error: typesError } = await supabase
        .from("leave_types")
        .select("*")
        .order("name");

      // Fetch leave balances for current user
      const { data: balancesData, error: balancesError } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", session.user.id);

      if (typesError || balancesError) {
        throw new Error("Failed to fetch leave data");
      }

      // Merge leave types with balances
      const mergedData = typesData.map(type => {
        const balance = balancesData?.find(b => b.leave_type_id === type.id);
        return {
          ...type,
          total_days: balance?.total_days || 0,
          used_days: balance?.used_days || 0,
          remaining_days: balance?.remaining_days || 0,
          balance_id: balance?.id
        };
      });

      setLeaveTypes(typesData);
      setLeaveBalances(mergedData);
    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLeaveHistory = async (leaveTypeId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("leave_type_id", leaveTypeId)
        .order("start_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching leave history:", error);
      return [];
    }
  };

  const calculatePercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Leave Balance</h1>
          <p className="text-gray-600 mt-2">View your available leave days and usage</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-600 mt-1">
                  Employee ID: {user.employee_id || "N/A"} | Department: {user.department || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">Total Available Leave</p>
                <p className="text-2xl font-bold text-green-600">
                  {leaveBalances.reduce((total, balance) => total + balance.remaining_days, 0)} days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leave Balances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {leaveBalances.map((balance, index) => {
            const percentage = calculatePercentage(balance.used_days, balance.total_days);
            const history = getLeaveHistory(balance.id);

            return (
              <div key={balance.id || index} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{balance.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{balance.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      balance.remaining_days > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {balance.remaining_days > 0 ? 'Available' : 'Exhausted'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Used: {balance.used_days} days</span>
                      <span>Total: {balance.total_days} days</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentage >= 80 ? 'bg-red-500' : 
                          percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Balance Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-600">{balance.total_days}</p>
                      <p className="text-xs text-gray-600">Total Days</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-orange-600">{balance.used_days}</p>
                      <p className="text-xs text-gray-600">Used</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-600">{balance.remaining_days}</p>
                      <p className="text-xs text-gray-600">Remaining</p>
                    </div>
                  </div>

                  {/* Leave Details */}
                  {balance.leave_policy && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Leave Policy</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {balance.leave_policy}</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        // Navigate to leave request page
                        window.location.href = `/leaves/request?type=${balance.id}`;
                      }}
                      disabled={balance.remaining_days === 0}
                      className={`flex-1 px-4 py-2 rounded ${
                        balance.remaining_days === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Request Leave
                    </button>
                    <button
                      onClick={async () => {
                        const history = await getLeaveHistory(balance.id);
                        // Show leave history in modal
                        alert(`Showing history for ${balance.name}`);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      History
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Leave Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {leaveBalances.reduce((total, balance) => total + balance.total_days, 0)}
              </p>
              <p className="text-gray-700 mt-2">Total Leave Days Allocated</p>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {leaveBalances.reduce((total, balance) => total + balance.used_days, 0)}
              </p>
              <p className="text-gray-700 mt-2">Total Days Used</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {leaveBalances.reduce((total, balance) => total + balance.remaining_days, 0)}
              </p>
              <p className="text-gray-700 mt-2">Total Days Available</p>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="mt-8 pt-8 border-t">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Leave Usage Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">!</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Plan Ahead</p>
                  <p className="text-sm text-gray-600">
                    Submit leave requests at least 2 weeks in advance for better approval chances.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Check Balance</p>
                  <p className="text-sm text-gray-600">
                    Always check your remaining balance before submitting a leave request.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}