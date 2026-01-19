import { useState } from "react";
import { supabase } from "../../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ApplyLeave() {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!leaveType || !startDate || !endDate) {
      setError("Leave type, start date and end date are required");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employee) {
      setError("Employee profile not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("leaves").insert({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: "pending",
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/employee/leaves");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Apply for Leave
      </h1>

      {error && (
        <p className="text-red-500 mb-4 text-center">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Leave Type
          </label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select leave type</option>
            <option value="Casual">Casual</option>
            <option value="Paid">Paid</option>
            <option value="Sick">Sick</option>
          </select>
        </div>

        {/* From */}
        <div>
          <label className="block text-sm font-medium mb-1">
            From
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium mb-1">
            To
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            rows="4"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Leave Request"}
        </button>
      </form>
    </div>
  );
}
