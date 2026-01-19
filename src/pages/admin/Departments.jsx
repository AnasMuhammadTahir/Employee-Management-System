import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("created_at", { ascending: false });

    setDepartments(data || []);
  }

  async function deleteDepartment(id) {
    if (!confirm("Delete this department?")) return;
    await supabase.from("departments").delete().eq("id", id);
    fetchDepartments();
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto%">

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-center mb-8 mt-10">
        Manage Departments
      </h1>

      {/* SEARCH + ADD */}
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search departments..."
          className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />


        <button
          onClick={() => navigate("/admin/departments/new")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Department
        </button>
      </div>

      {/* LIST */}

              <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">
                  Department
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDepartments.map((dept, index) => (
                <tr key={dept.id} className="border-t">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-gray-500">
                      {dept.description || "No description"}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() =>
                          navigate(`/admin/departments/${dept.id}/edit`)
                        }
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteDepartment(dept.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No departments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>         

       
      </div>
  );
}
