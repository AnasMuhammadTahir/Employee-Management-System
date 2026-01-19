import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

export default function EmployeeSalary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSalary();
  }, []);

  async function fetchSalary() {
    const { data } = await supabase
      .from("employees")
      .select("salary")
      .eq("id", id)
      .single();

    setSalary(data?.salary || "");
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("employees")
      .update({ salary })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      navigate(`/admin/employees/${id}`);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Manage Salary
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          placeholder="Monthly Salary"
          className="w-full border rounded-lg px-4 py-2"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
        <div className="mt-6 flex justify-between">
        <button
            onClick={() => navigate("/admin/employees")}
            className="text-gray-600 hover:underline"
            >
            ← Back 
        </button> 

        <button className="w-30 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Update Salary
        </button>
        </div>
      </form>
    </div>
  );
}
