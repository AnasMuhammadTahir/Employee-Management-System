import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

export default function EditDepartment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDepartment();
  }, []);

  async function fetchDepartment() {
    const { data, error } = await supabase
      .from("departments")
      .select("name, description")
      .eq("id", id)
      .single();

    if (error) {
      setError("Department not found");
    } else {
      setName(data.name);
      setDescription(data.description || "");
    }

    setLoading(false);
  }

  async function handleUpdate(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    const { error } = await supabase
      .from("departments")
      .update({ name, description })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      navigate("/admin/departments");
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Update Department
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          type="text"
          placeholder="Department Name"
          className="w-full border rounded-lg px-4 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Department Description"
          className="w-full border rounded-lg px-4 py-2"
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Update Department
        </button>
      </form>
    </div>
  );
}
