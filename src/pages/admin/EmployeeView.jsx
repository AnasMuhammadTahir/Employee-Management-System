import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

export default function EmployeeView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, []);

  async function fetchEmployee() {
    const { data } = await supabase
      .from("employees")
      .select(`
        name,
        dob,
        salary,
        departments ( name )
      `)
      .eq("id", id)
      .single();

    setEmployee(data);
    setLoading(false);
  }

  if (loading) return <p>Loading...</p>;
  if (!employee) return <p>Employee not found</p>;

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Employee Details
      </h1>

      <div className="space-y-4">
        <Info label="Name" value={employee.name} />
        <Info
          label="Date of Birth"
          value={new Date(employee.dob).toLocaleDateString()}
        />
        <Info
          label="Department"
          value={employee.departments?.name || "—"}
        />
        <Info
          label="Monthly Salary"
          value={
            employee.salary
              ? `$ ${employee.salary}`
              : "Not set"
          }
        />

        <Info
          label="Leaves Taken"
          value="— (will be added later)"
        />
      </div>

      <div className="mt-6 flex justify-between">
        <button
            onClick={() => navigate("/admin/employees")}
            className="text-gray-600 hover:underline"
            >
            ← Back 
        </button>      

        <button
          onClick={() =>
            navigate(`/admin/employees/${id}/salary`)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Manage Salary
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
