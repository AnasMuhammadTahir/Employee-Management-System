import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        dob,
        departments (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setEmployees(data || []);
    }

    setLoading(false);
  }

  async function handleDelete(userId) {
  const confirmDelete = window.confirm(
    "This will permanently delete the employee account. Continue?"
  );

  if (!confirmDelete) return;

  const { error } = await supabase.functions.invoke(
    "delete-employee",
    {
      body: { user_id: userId },
    }
  );

  if (!error) {
    setEmployees((prev) =>
      prev.filter((emp) => emp.user_id !== userId)
    );
  } else {
    alert("Failed to delete employee");
  }
}

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Employees</h1>

        <button
          onClick={() => navigate("/admin/employees/add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Date of Birth</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-gray-500">
                  Loading employees...
                </td>
              </tr>
            )}

            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-gray-400">
                  No employees found
                </td>
              </tr>
            )}

            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium">{emp.name}</td>

                <td className="px-6 py-4">
                  {emp.departments?.name || "—"}
                </td>

                <td className="px-6 py-4">
                  {emp.dob
                    ? new Date(emp.dob).toLocaleDateString()
                    : "—"}
                </td>

                <td className="px-6 py-4 text-right space-x-4">
                  <button
                    onClick={() =>
                      navigate(`/admin/employees/${emp.id}`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/admin/employees/${emp.id}/edit`)
                    }
                    className="text-gray-600 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/admin/employees/${emp.id}/salary`)
                    }
                    className="text-green-600 hover:underline"
                  >
                    Salary
                  </button>

                  <button
                    onClick={() => handleDelete(emp.user_id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
