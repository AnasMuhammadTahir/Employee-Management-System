import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../supabaseClient";
import {
  Calendar,
  AlertCircle,
  Clock,
  Calculator,
  ChevronDown,
  ChevronUp,
  XCircle
} from "lucide-react";

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    reason: "",
    emergency_contact: "",
    handover_notes: ""
  });
  const [totalDays, setTotalDays] = useState(0);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState("first_half"); // first_half or second_half

  useEffect(() => {
    fetchLeaveData();
  }, []);

  useEffect(() => {
    calculateTotalDays();
  }, [form.start_date, form.end_date, isHalfDay]);

  async function fetchLeaveData() {
    try {
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

      // Fetch leave types
      const { data: types } = await supabase
        .from("leave_types")
        .select("*")
        .order("name");

      setLeaveTypes(types || []);

      // Fetch leave balances for current year
      const currentYear = new Date().getFullYear();
      const { data: balances } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_types (name, is_paid)
        `)
        .eq("employee_id", employee.id)
        .eq("year", currentYear);

      setLeaveBalances(balances || []);

    } catch (error) {
      console.error("Error fetching leave data:", error);
    }
  }

  function calculateTotalDays() {
    if (!form.start_date || !form.end_date) {
      setTotalDays(0);
      return;
    }

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    
    if (start > end) {
      setTotalDays(0);
      return;
    }

    if (isHalfDay && form.start_date === form.end_date) {
      setTotalDays(0.5);
      return;
    }

    // Calculate business days
    let days = 0;
    let current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    setTotalDays(days);
  }

  function getLeaveBalance(leaveTypeId) {
    const balance = leaveBalances.find(b => b.leave_type_id === leaveTypeId);
    return balance ? balance.remaining : 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate form
      if (!selectedLeaveType) {
        throw new Error("Please select a leave type");
      }

      if (!form.start_date || !form.end_date) {
        throw new Error("Please select start and end dates");
      }

      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      
      if (start > end) {
        throw new Error("Start date cannot be after end date");
      }

      // Check if dates are in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        throw new Error("Cannot apply for leave in the past");
      }

      // Check leave balance
      const balance = getLeaveBalance(selectedLeaveType);
      const leaveDays = isHalfDay && form.start_date === form.end_date ? 0.5 : totalDays;
      
      if (leaveDays > balance) {
        throw new Error(`Insufficient leave balance. Available: ${balance} days`);
      }

      // Get current user and employee
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) throw new Error("Employee not found");

      // Calculate actual total days (considering half day)
      const actualTotalDays = isHalfDay && form.start_date === form.end_date ? 0.5 : totalDays;

      // Insert leave request
      const { error: leaveError } = await supabase
        .from("leaves")
        .insert({
          employee_id: employee.id,
          leave_type_id: selectedLeaveType,
          start_date: form.start_date,
          end_date: form.end_date,
          total_days: actualTotalDays,
          reason: form.reason,
          emergency_contact: form.emergency_contact || null,
          handover_notes: form.handover_notes || null,
          status: "pending",
          is_half_day: isHalfDay && form.start_date === form.end_date,
          half_day_type: isHalfDay && form.start_date === form.end_date ? halfDayType : null
        });

      if (leaveError) throw leaveError;

      setSuccess("Leave request submitted successfully!");
      
      // Reset form
      setSelectedLeaveType("");
      setForm({
        start_date: "",
        end_date: "",
        reason: "",
        emergency_contact: "",
        handover_notes: ""
      });
      setTotalDays(0);
      setIsHalfDay(false);
      setHalfDayType("first_half");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/employee/leaves");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getSelectedLeaveType() {
    return leaveTypes.find(lt => lt.id === selectedLeaveType);
  }

  const selectedType = getSelectedLeaveType();
  const availableBalance = getLeaveBalance(selectedLeaveType);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-gray-600 mt-2">Submit a new leave request</p>
        </div>
        <button
          onClick={() => navigate("/employee/leaves")}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Leaves
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Success!</p>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Leave Type Selection */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">1. Select Leave Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedLeaveType(type.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedLeaveType === type.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    type.is_paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {type.is_paid ? "Paid" : "Unpaid"}
                  </span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Available Balance:</span>
                    <span className="font-medium text-green-600">
                      {getLeaveBalance(type.id)} days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Max Days:</span>
                    <span className="font-medium">{type.max_days || "Unlimited"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">2. Select Dates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={form.start_date}
                  onChange={(e) => setForm({...form, start_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={form.end_date}
                  onChange={(e) => setForm({...form, end_date: e.target.value})}
                  min={form.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Days
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calculator className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{totalDays}</p>
                  <p className="text-sm text-gray-500">Business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Half Day Option */}
          {form.start_date && form.start_date === form.end_date && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium">Half Day Leave</span>
                </label>
                {isHalfDay && <span className="text-blue-600">0.5 day</span>}
              </div>
              
              {isHalfDay && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <button
                    type="button"
                    onClick={() => setHalfDayType("first_half")}
                    className={`p-3 border rounded-lg text-center ${
                      halfDayType === "first_half"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="font-medium">First Half</span>
                    <p className="text-sm text-gray-500 mt-1">9:00 AM - 1:00 PM</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfDayType("second_half")}
                    className={`p-3 border rounded-lg text-center ${
                      halfDayType === "second_half"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="font-medium">Second Half</span>
                    <p className="text-sm text-gray-500 mt-1">1:00 PM - 5:00 PM</p>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6">3. Additional Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leave *
              </label>
              <textarea
                required
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Please provide details about your leave..."
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Phone number (optional)"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({...form, emergency_contact: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handover Notes
                </label>
                <textarea
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Any work handover notes (optional)"
                  value={form.handover_notes}
                  onChange={(e) => setForm({...form, handover_notes: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedType && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">4. Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Leave Type</p>
                  <p className="text-gray-600">{selectedType.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedType.is_paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {selectedType.is_paid ? "Paid Leave" : "Unpaid Leave"}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-gray-600">
                    {form.start_date ? new Date(form.start_date).toLocaleDateString() : "-"} to{" "}
                    {form.end_date ? new Date(form.end_date).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{totalDays} days</p>
                  {isHalfDay && (
                    <p className="text-sm text-gray-600">Half day ({halfDayType.replace('_', ' ')})</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Available Balance</p>
                  <p className="text-gray-600">After this leave</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    totalDays > availableBalance ? "text-red-600" : "text-green-600"
                  }`}>
                    {Math.max(availableBalance - totalDays, 0)} days
                  </p>
                  <p className="text-sm text-gray-600">Currently: {availableBalance} days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={() => navigate("/employee/leaves")}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            {totalDays > availableBalance && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Exceeds available balance</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || totalDays === 0 || totalDays > availableBalance}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                "Submit Leave Request"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CheckCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}