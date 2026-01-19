import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  async function fetchLeaves() {
    const { data } = await supabase
      .from("leaves")
      .select(`
        id,
        start_date,
        end_date,
        reason,
        status,
        employees (
          name
        )
      `)
      .order("created_at", { ascending: false });

    setLeaves(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase
      .from("leaves")
      .update({ status })
      .eq("id", id);

    fetchLeaves();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-8 mt-10">
        Manage Leaves Requests 
      </h1>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id} className="border-t">
                <td className="px-4 py-3 font-medium">
                  {leave.employees?.name}
                </td>

                <td className="px-4 py-3">
                  {leave.start_date}
                </td>

                <td className="px-4 py-3">
                  {leave.end_date}
                </td>

                <td className="px-4 py-3">
                  {leave.reason || "—"}
                </td>

                <td className="px-4 py-3 capitalize">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      leave.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : leave.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {leave.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {leave.status === "pending" && (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() =>
                          updateStatus(leave.id, "approved")
                        }
                        className="text-green-600 hover:underline"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(leave.id, "rejected")
                        }
                        className="text-red-600 hover:underline"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {leaves.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-gray-500"
                >
                  No leave requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
