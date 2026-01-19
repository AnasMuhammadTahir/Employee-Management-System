import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function ProfileEditRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profile_edit_requests")
      .select(`
        id,
        status,
        created_at,
        requested_name,
        requested_dob,
        employees (
          id,
          name,
          dob,
          department_id,
          departments ( name )
        ),
        requested_department:departments!profile_edit_requests_requested_department_id_fkey (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  }

  async function approveRequest(req) {
    await supabase
      .from("employees")
      .update({
        name: req.requested_name ?? req.employees.name,
        dob: req.requested_dob ?? req.employees.dob,
        department_id:
          req.requested_department?.id ?? req.employees.department_id,
      })
      .eq("id", req.employees.id);

    await supabase
      .from("profile_edit_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    fetchRequests();
  }

  async function rejectRequest(id) {
    await supabase
      .from("profile_edit_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    fetchRequests();
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-center mb-6">
        Profile Edit Requests
      </h1>

      {loading && (
        <p className="text-center text-gray-500">Loading...</p>
      )}

      {!loading && requests.length === 0 && (
        <p className="text-center text-gray-500">
          No profile edit requests
        </p>
      )}

      <div className="space-y-6">
        {requests.map((req) => (
          <div
            key={req.id}
            className="border border-gray-200 rounded-lg p-5"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-lg font-semibold">
                  {req.employees.name}
                </p>
                <p className="text-sm text-gray-500">
                  Requested on{" "}
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>

              <StatusBadge status={req.status} />
            </div>

            {/* CONTENT */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Info */}
              <div>
                <h3 className="font-semibold mb-2">
                  Current Information
                </h3>
                <InfoRow label="Name" value={req.employees.name} />
                <InfoRow label="DOB" value={req.employees.dob} />
                <InfoRow
                  label="Department"
                  value={req.employees.departments?.name}
                />
              </div>

              {/* Requested Info */}
              <div>
                <h3 className="font-semibold mb-2 text-blue-600">
                  Requested Changes
                </h3>

                {req.requested_name ? (
                  <InfoRow
                    label="New Name"
                    value={req.requested_name}
                  />
                ) : (
                  <Muted>No name change</Muted>
                )}

                {req.requested_dob ? (
                  <InfoRow
                    label="New DOB"
                    value={req.requested_dob}
                  />
                ) : (
                  <Muted>No DOB change</Muted>
                )}

                {req.requested_department ? (
                  <InfoRow
                    label="New Department"
                    value={req.requested_department.name}
                  />
                ) : (
                  <Muted>No department change</Muted>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-5 flex flex-wrap gap-3">
              {req.status === "pending" && (
                <>
                  <button
                    onClick={() => approveRequest(req)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-200 py-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}

function Muted({ children }) {
  return (
    <p className="text-sm text-gray-400 italic">{children}</p>
  );
}

function StatusBadge({ status }) {
  if (status === "approved") {
    return (
      <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-700">
      Pending
    </span>
  );
}
