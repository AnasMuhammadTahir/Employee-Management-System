import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EditProfileRequest() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    department_id: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("departments").select("id, name")
      .then(({ data }) => setDepartments(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    await supabase.from("profile_edit_requests").insert({
      employee_id: employee.id,
      requested_name: form.name || null,
      requested_dob: form.dob || null,
      requested_department_id: form.department_id || null,
    });

    navigate("/employee/profile");
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow max-w-lg w-full space-y-4"
      >
        <h2 className="text-xl font-bold text-center">
          Request Profile Update
        </h2>

        <input
          placeholder="New Name (optional)"
          className="w-full border rounded px-4 py-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="date"
          className="w-full border rounded px-4 py-2"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
        />

        <select
          className="w-full border rounded px-4 py-2"
          value={form.department_id}
          onChange={(e) =>
            setForm({ ...form, department_id: e.target.value })
          }
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Submit Request
        </button>
      </form>
    </div>
  );
}
