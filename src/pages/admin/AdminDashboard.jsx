export default function AdminDashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-8 mt-10">Dashboard Overview</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-indigo-100 p-6 rounded-xl shadow">
          <h3 className="text-sm text-gray-500">Total Employees</h3>
          <p className="text-3xl font-bold text-indigo-600">12</p>
        </div>

        <div className="bg-yellow-100 p-6 rounded-xl shadow">
          <h3 className="text-sm text-gray-500">Total Departments</h3>
          <p className="text-3xl font-bold text-yellow-600">4</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Leave Overview</h2>

      <div className="grid md:grid-cols-4 gap-6">
        <Stat label="Applied" value="10" color="blue" />
        <Stat label="Approved" value="6" color="green" />
        <Stat label="Pending" value="3" color="orange" />
        <Stat label="Rejected" value="1" color="red" />
      </div>
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className={`bg-${color}-100 p-6 rounded-xl shadow`}>
      <h3 className="text-sm text-gray-500">{label}</h3>
      <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
    </div>
  );
}
