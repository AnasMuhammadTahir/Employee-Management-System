import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Plus, Search } from "lucide-react";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const { data: departmentsData, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;

      // Get manager names for each department
      if (departmentsData && departmentsData.length > 0) {
        const managerIds = departmentsData
          .map(dept => dept.manager_id)
          .filter(id => id);
        
        if (managerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", managerIds);
          
          const managersMap = {};
          profilesData?.forEach(profile => {
            managersMap[profile.id] = profile.full_name;
          });
          setManagers(managersMap);
        }
      }

      setDepartments(departmentsData || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDepartment(id) {
    if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) return;
    
    try {
      // Check if department has employees
      const { data: employees } = await supabase
        .from("profiles")
        .select("id")
        .eq("department", id);
      
      if (employees && employees.length > 0) {
        alert("Cannot delete department that has employees assigned. Please reassign employees first.");
        return;
      }

      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      alert("Department deleted successfully!");
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department");
    }
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
              <p className="text-gray-600 mt-2">Manage organizational departments and assign managers</p>
            </div>
            <button
              onClick={() => navigate("/admin/departments/new")}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} className="mr-2" />
              Add New Department
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search departments by name or description..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Total Departments</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">With Managers</p>
                <p className="text-2xl font-bold text-green-600">
                  {departments.filter(d => d.manager_id).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Without Managers</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {departments.filter(d => !d.manager_id).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">
                  {departments.length > 0 ? "Loading..." : "0"}
                </p>
              </div>
            </div>

            {/* Departments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {dept.description || "No description"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dept.manager_id ? (
                              <div className="text-sm text-gray-900">
                                {managers[dept.manager_id] || "Loading..."}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 italic">No manager assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(dept.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/admin/departments/${dept.id}/edit`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => deleteDepartment(dept.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="text-gray-400 mb-4">
                            <Search size={48} className="mx-auto" />
                          </div>
                          <p className="text-gray-900 font-medium">No departments found</p>
                          <p className="text-gray-600 mt-1">
                            {search ? "Try a different search term" : "Create your first department"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}