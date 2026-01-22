import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";

export default function AddDepartment() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchManagers();
  }, []);

  async function fetchManagers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "employee") // Only employees can be managers
        .order("full_name");

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Department name is required");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name,
          description,
          manager_id: managerId || null
        })
        .select()
        .single();

      if (error) throw error;

      // If a manager is assigned, update their department
      if (managerId) {
        await supabase
          .from("profiles")
          .update({ department: data.id }) // Store department ID instead of name
          .eq("id", managerId);
      }

      alert("Department added successfully!");
      navigate("/admin/departments");
    } catch (error) {
      console.error("Error adding department:", error);
      setError(error.message || "Failed to add department");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/departments")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Departments
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Department</h1>
          <p className="text-gray-600 mt-2">Create a new department and assign a manager</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                placeholder="Enter department name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter department description"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a manager (optional)</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name} ({manager.email})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                The manager will be automatically assigned to this department
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin/departments")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin mr-2" size={18} />
                    Adding...
                  </span>
                ) : (
                  "Add Department"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}