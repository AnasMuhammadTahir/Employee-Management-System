import { useEffect, useState } from "react";
import { supabase } from "../../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EmployeeLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  async function fetchLeaves() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employee) return;

    let query = supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setLeaves(data || []);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center mt-2">
        Manage Leaves
      </h1>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={() => navigate("/employee/leaves/apply")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Leave
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th>S No.</Th>
              <Th>Leave Type</Th>
              <Th>From</Th>
              <Th>To</Th>
              <Th>Description</Th>
              <Th>Applied Date</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {leaves.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 border-b border-gray-200"
                >
                  No leaves found
                </td>
              </tr>
            )}

            {leaves.map((leave, index) => (
              <tr
                key={leave.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <Td>{index + 1}</Td>
                <Td>{leave.leave_type}</Td>
                <Td>{leave.start_date}</Td>
                <Td>{leave.end_date}</Td>
                <Td>{leave.reason || "-"}</Td>
                <Td>
                  {new Date(leave.created_at).toLocaleDateString()}
                </Td>
                <Td>
                  <StatusBadge status={leave.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>;
}

function StatusBadge({ status }) {
  const base = "px-3 py-1 rounded-full text-sm font-medium";

  if (status === "approved")
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        Approved
      </span>
    );

  if (status === "rejected")
    return (
      <span className={`${base} bg-red-100 text-red-700`}>
        Rejected
      </span>
    );

  return (
    <span className={`${base} bg-yellow-100 text-yellow-700`}>
      Pending
    </span>
  );
}
