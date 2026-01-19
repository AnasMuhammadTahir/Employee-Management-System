import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [salary, setSalary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // employee profile
      const { data: employee } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          dob,
          departments ( name )
        `)
        .eq("user_id", user.id)
        .single();

      if (!employee) return;
      setProfile(employee);

      // latest salary record
      const { data: salaryData } = await supabase
        .from("salaries")
        .select("salary, allowance, deduction, total")
        .eq("employee_id", employee.id)
        .order("pay_date", { ascending: false })
        .limit(1)
        .single();

      setSalary(salaryData);
    }

    fetchProfile();
  }, []);

  if (!profile) return null;

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          My Profile
        </h1>

        {/* Profile info */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Image */}
          <img
            src={`https://ui-avatars.com/api/?name=${profile.name}&background=2563eb&color=fff&size=128`}
            alt="Profile"
            className="w-32 h-32 rounded-full border"
          />

          {/* Details */}
          <div className="flex-1 space-y-4 w-full">
            <ProfileRow label="Name" value={profile.name} />
            <ProfileRow label="Employee ID" value={profile.id} />
            <ProfileRow label="Date of Birth" value={profile.dob} />
            <ProfileRow
              label="Department"
              value={profile.departments?.name || "-"}
            />
          </div>
        </div>

        {/* Salary Info */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">
            Salary Information
          </h2>

          {salary ? (
            <div className="grid grid-cols-2 gap-4">
              <ProfileRow label="Base Salary" value={salary.salary} />
              <ProfileRow label="Allowance" value={salary.allowance} />
              <ProfileRow label="Deduction" value={salary.deduction} />
              <ProfileRow label="Total Pay" value={salary.total} />
            </div>
          ) : (
            <p className="text-gray-500">No salary record available</p>
          )}
        </div>

        {/* Edit request */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/employee/profile/edit-request")}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Request Profile Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-200 pb-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value ?? "-"}</span>
    </div>
  );
}
