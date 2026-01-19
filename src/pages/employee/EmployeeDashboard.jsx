import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";


export default function EmployeeDashboard() {
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get employee profile
      const { data: employee } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;

      setName(employee.name);

      // Get leave stats
      const { data: leaves } = await supabase
        .from("leaves")
        .select("status")
        .eq("employee_id", employee.id);

      const counts = {
        approved: leaves.filter(l => l.status === "approved").length,
        pending: leaves.filter(l => l.status === "pending").length,
        rejected: leaves.filter(l => l.status === "rejected").length,
      };

      setStats(counts);
    }

    loadDashboard();
  }, []);

  return (
    
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold">
          Welcome back{ name && `, ${name}` } 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here’s a quick overview of your leave activity
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Approved Leaves"
          value={stats.approved}
          color="text-green-600"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending}
          color="text-yellow-600"
        />
        <StatCard
          title="Rejected Leaves"
          value={stats.rejected}
          color="text-red-600"
        />
      </div>
    </div>
    
  );
}

function StatCard({ title, value, color }) {
  return (
    
    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
    
  );
}
