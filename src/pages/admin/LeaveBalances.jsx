import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

export default function LeaveBalances() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [editingLeave, setEditingLeave] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, department")
        .order("full_name");

      // Fetch leave balances
      const { data: leaveBalances, error: balancesError } = await supabase
        .from("leave_balances")
        .select("*");

      // Fetch leave types
      const { data: leaveTypesData, error: typesError } = await supabase
        .from("leave_types")
        .select("*");

      if (employeesError || balancesError || typesError) {
        throw new Error("Failed to fetch data");
      }

      // Merge employee data with their leave balances
      const employeesWithBalances = employeesData.map(employee => {
        const employeeBalances = leaveBalances.filter(
          balance => balance.user_id === employee.id
        );
        return {
          ...employee,
          leave_balances: employeeBalances
        };
      });

      setEmployees(employeesWithBalances);
      setLeaveTypes(leaveTypesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleEditLeave = (leave) => {
    setEditingLeave({ ...leave });
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from("leave_balances")
        .update({
          total_days: editingLeave.total_days,
          used_days: editingLeave.used_days,
          remaining_days: editingLeave.total_days - editingLeave.used_days
        })
        .eq("id", editingLeave.id);

      if (error) throw error;

      await fetchData();
      setEditingLeave(null);
      alert("Leave balance updated successfully!");
    } catch (error) {
      console.error("Error updating leave balance:", error);
      alert("Failed to update leave balance");
    }
  };

  const handleAddLeaveBalance = async (userId, leaveTypeId) => {
    try {
      const { error } = await supabase
        .from("leave_balances")
        .insert({
          user_id: userId,
          leave_type_id: leaveTypeId,
          total_days: 0,
          used_days: 0,
          remaining_days: 0
        });

      if (error) throw error;

      await fetchData();
      alert("Leave balance added!");
    } catch (error) {
      console.error("Error adding leave balance:", error);
      alert("Failed to add leave balance");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Leave Balances</h1>
          <p className="text-gray-600 mt-2">Manage and view employee leave balances</p>
        </div>

        {/* Employees List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {employees.map(employee => (
            <div key={employee.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {employee.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">{employee.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Department: {employee.department || "Not specified"}
                  </p>
                </div>
                <button
                  onClick={() => handleViewDetails(employee)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View Details
                </button>
              </div>

              {/* Leave Summary */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Leave Summary</h4>
                {employee.leave_balances && employee.leave_balances.length > 0 ? (
                  <div className="space-y-2">
                    {employee.leave_balances.map(balance => {
                      const leaveType = leaveTypes.find(lt => lt.id === balance.leave_type_id);
                      return (
                        <div key={balance.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {leaveType?.name || "Unknown Type"}
                          </span>
                          <span className="text-sm font-medium">
                            {balance.remaining_days} / {balance.total_days} days
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No leave balances found</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Employee Details Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedEmployee.full_name}
                    </h2>
                    <p className="text-gray-600">{selectedEmployee.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Leave Balances
                    </h3>
                    {selectedEmployee.leave_balances && selectedEmployee.leave_balances.length > 0 ? (
                      <div className="space-y-4">
                        {selectedEmployee.leave_balances.map(balance => {
                          const leaveType = leaveTypes.find(lt => lt.id === balance.leave_type_id);
                          return (
                            <div key={balance.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {leaveType?.name || "Unknown Type"}
                                </h4>
                                {editingLeave?.id === balance.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingLeave(null)}
                                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditLeave(balance)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                              
                              {editingLeave?.id === balance.id ? (
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                      Total Days
                                    </label>
                                    <input
                                      type="number"
                                      value={editingLeave.total_days}
                                      onChange={(e) => setEditingLeave({
                                        ...editingLeave,
                                        total_days: parseInt(e.target.value) || 0
                                      })}
                                      className="w-full px-3 py-2 border rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                      Used Days
                                    </label>
                                    <input
                                      type="number"
                                      value={editingLeave.used_days}
                                      onChange={(e) => setEditingLeave({
                                        ...editingLeave,
                                        used_days: parseInt(e.target.value) || 0
                                      })}
                                      className="w-full px-3 py-2 border rounded"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                      {balance.total_days}
                                    </p>
                                    <p className="text-xs text-gray-500">Total</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">
                                      {balance.used_days}
                                    </p>
                                    <p className="text-xs text-gray-500">Used</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                      {balance.remaining_days}
                                    </p>
                                    <p className="text-xs text-gray-500">Remaining</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500">No leave balances found</p>
                    )}
                  </div>

                  {/* Add New Leave Balance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Add New Leave Balance
                    </h3>
                    <div className="flex space-x-4">
                      <select className="flex-1 px-3 py-2 border rounded">
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.querySelector('select');
                          const leaveTypeId = select.value;
                          if (leaveTypeId) {
                            handleAddLeaveBalance(selectedEmployee.id, leaveTypeId);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}