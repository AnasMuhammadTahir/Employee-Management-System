import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddEmployee() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .order("name");

    setDepartments(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

const { data: authData, error: authError } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

if (authError) {
  setError(authError.message);
  setLoading(false);
  return;
}

const { error } = await supabase.from("employees").insert({
  user_id: authData.user.id,
  name,
  dob,
  department_id: departmentId,
});

  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Add New Employee
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Employee Name"
          className="w-full border rounded-lg px-4 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="date"
          className="w-full border rounded-lg px-4 py-2"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />

        <select
          className="w-full border rounded-lg px-4 py-2"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add Employee
        </button>
      </form>
    </div>
  );
}
