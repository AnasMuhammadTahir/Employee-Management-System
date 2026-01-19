import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
    fetchDepartments();
  }, []);

  async function fetchEmployee() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Employee not found");
      navigate("/admin/employees");
      return;
    }

    setName(data.name);
    setDob(data.dob);
    setDepartmentId(data.department_id);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .order("name");

    setDepartments(data || []);
  }

  async function handleUpdate(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("employees")
      .update({
        name,
        dob,
        department_id: departmentId,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/admin/employees");
  }

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-center mb-6">
        Edit Employee
      </h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            className="w-full border rounded-lg px-4 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Date of Birth
          </label>
          <input
            type="date"
            className="w-full border rounded-lg px-4 py-2"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Department
          </label>
          <select
            className="w-full border rounded-lg px-4 py-2"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate("/admin/employees")}
            className="text-gray-600 hover:underline"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Update Employee
          </button>
        </div>
      </form>
    </div>
  );
}
