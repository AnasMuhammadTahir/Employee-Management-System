import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddDepartment() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("departments").insert({
      name,
      description,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/admin/departments");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Add New Department
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add Department
        </button>
      </form>
    </div>
  );
}
