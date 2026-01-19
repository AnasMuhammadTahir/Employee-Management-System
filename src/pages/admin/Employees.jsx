import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data } = await supabase
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

    setEmployees(data || []);
  }

  async function deleteEmployee(id) {
    if (!confirm("Delete this employee?")) return;
    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-center mb-8 mt-10">
        Manage Employees
      </h1>

      {/* SEARCH + ADD */}
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search employees..."
          className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => navigate("/admin/employees/new")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Employee
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Date of Birth</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr key={emp.id} className="border-t">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{emp.name}</td>

                <td className="px-4 py-3">
                {emp.departments?.name || "—"}
                </td>

                <td className="px-4 py-3">
                {new Date(emp.dob).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-center gap-4">
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
                        navigate(`/admin/employees/${emp.id}/salary`)
                      }
                      className="text-green-600 hover:underline"
                    >
                      Salary
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/admin/employees/${emp.id}/edit`)
                      }
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-500"
                >
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
