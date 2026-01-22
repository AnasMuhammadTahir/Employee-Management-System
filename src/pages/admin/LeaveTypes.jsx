import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import {
  Calendar,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Clock,
  DollarSign
} from "lucide-react";

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    max_days: "",
    is_paid: true,
    requires_approval: true,
    accrual_rate: "",
    min_service_days: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  async function fetchLeaveTypes() {
    try {
      const { data } = await supabase
        .from("leave_types")
        .select("*")
        .order("created_at");

      setLeaveTypes(data || []);
    } catch (error) {
      console.error("Error fetching leave types:", error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(leaveType) {
    setEditingId(leaveType.id);
    setForm({
      name: leaveType.name,
      description: leaveType.description || "",
      max_days: leaveType.max_days || "",
      is_paid: leaveType.is_paid,
      requires_approval: leaveType.requires_approval !== false,
      accrual_rate: leaveType.accrual_rate || "",
      min_service_days: leaveType.min_service_days || ""
    });
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm();
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      max_days: "",
      is_paid: true,
      requires_approval: true,
      accrual_rate: "",
      min_service_days: ""
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        // Update existing leave type
        const { error } = await supabase
          .from("leave_types")
          .update({
            ...form,
            max_days: form.max_days ? parseInt(form.max_days) : null,
            accrual_rate: form.accrual_rate ? parseFloat(form.accrual_rate) : null,
            min_service_days: form.min_service_days ? parseInt(form.min_service_days) : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingId);

        if (error) throw error;

        setSuccess("Leave type updated successfully!");
      } else {
        // Create new leave type
        const { error } = await supabase
          .from("leave_types")
          .insert({
            ...form,
            max_days: form.max_days ? parseInt(form.max_days) : null,
            accrual_rate: form.accrual_rate ? parseFloat(form.accrual_rate) : null,
            min_service_days: form.min_service_days ? parseInt(form.min_service_days) : null
          });

        if (error) throw error;

        setSuccess("Leave type created successfully!");
      }

      fetchLeaveTypes();
      setEditingId(null);
      resetForm();

    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this leave type? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("leave_types")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSuccess("Leave type deleted successfully!");
      fetchLeaveTypes();

    } catch (err) {
      setError("Failed to delete leave type: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Types</h1>
          <p className="text-gray-600 mt-2">Manage different types of leaves in your organization</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Success!</p>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-6">
              {editingId ? "Edit Leave Type" : "Add New Leave Type"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Annual Leave"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Brief description of this leave type"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={form.max_days}
                    onChange={(e) => setForm({...form, max_days: e.target.value})}
                    placeholder="0 for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accrual Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={form.accrual_rate}
                    onChange={(e) => setForm({...form, accrual_rate: e.target.value})}
                    placeholder="Days per month"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Service Days
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={form.min_service_days}
                  onChange={(e) => setForm({...form, min_service_days: e.target.value})}
                  placeholder="Days before eligible"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_paid}
                    onChange={(e) => setForm({...form, is_paid: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="font-medium">Paid Leave</span>
                    <p className="text-sm text-gray-500">Employee receives salary during leave</p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.requires_approval}
                    onChange={(e) => setForm({...form, requires_approval: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="font-medium">Requires Approval</span>
                    <p className="text-sm text-gray-500">Leave requests need manager approval</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? "Update Leave Type" : "Add Leave Type"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">All Leave Types</h2>
              <p className="text-gray-500 mt-1">
                {leaveTypes.length} leave type{leaveTypes.length !== 1 ? 's' : ''} configured
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {leaveTypes.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No leave types found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add your first leave type using the form
                  </p>
                </div>
              ) : (
                leaveTypes.map((type) => (
                  <div key={type.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{type.name}</h3>
                          <div className="flex items-center gap-2">
                            {type.is_paid ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Paid
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Unpaid
                              </span>
                            )}
                            {!type.requires_approval && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Auto-approve
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {type.description && (
                          <p className="text-gray-600 mb-4">{type.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-500">Max Days</span>
                            </div>
                            <p className="font-bold text-lg">
                              {type.max_days || "Unlimited"}
                            </p>
                          </div>

                          {type.accrual_rate && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-gray-500">Accrual Rate</span>
                              </div>
                              <p className="font-bold text-lg">
                                {type.accrual_rate}/month
                              </p>
                            </div>
                          )}

                          {type.min_service_days && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-gray-500">Min Service</span>
                              </div>
                              <p className="font-bold text-lg">
                                {type.min_service_days} days
                              </p>
                            </div>
                          )}

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-500">Status</span>
                            </div>
                            <p className="font-bold text-lg">
                              {type.is_paid ? "Paid" : "Unpaid"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => startEdit(type)}
                          className="p-2 text-gray-600 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="p-2 text-gray-600 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Default Leave Types Info */}
          <div className="mt-8 bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Default Leave Types</h2>
            <p className="text-gray-600 mb-4">
              Consider adding these common leave types for your organization:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Annual Leave", days: 21, paid: true, desc: "Paid vacation leave" },
                { name: "Sick Leave", days: 14, paid: true, desc: "Medical leave" },
                { name: "Casual Leave", days: 7, paid: true, desc: "Personal/emergency leave" },
                { name: "Maternity Leave", days: 90, paid: true, desc: "Leave for childbirth" },
                { name: "Paternity Leave", days: 14, paid: true, desc: "Leave for new fathers" },
                { name: "Unpaid Leave", days: 0, paid: false, desc: "Leave without pay" }
              ].map((type, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-gray-500">{type.desc}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      type.paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {type.paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {type.days > 0 ? `${type.days} days per year` : "As needed"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}