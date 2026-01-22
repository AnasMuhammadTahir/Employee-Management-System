import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Save, User, Mail, Phone, Calendar, 
  Building, Briefcase, MapPin, CreditCard, AlertCircle, 
  CheckCircle, Loader2
} from "lucide-react";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department_id: "",
    hire_date: new Date().toISOString().split('T')[0],
    employee_code: "",
    status: "active"
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      // Fetch employee details
      const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (empError) throw empError;
      if (!employee) {
        setError("Employee not found");
        return;
      }

      setForm({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        position: employee.position || "",
        department_id: employee.department_id || "",
        hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : new Date().toISOString().split('T')[0],
        employee_code: employee.employee_code || "",
        status: employee.status || "active"
      });

      // Fetch departments
      const { data: deps, error: deptError } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (deptError) throw deptError;
      setDepartments(deps || []);

    } catch (error) {
      console.error("Error loading employee:", error);
      setError("Failed to load employee data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!form.name.trim() || !form.email.trim()) {
        throw new Error("Name and email are required");
      }

      // Check if email is already taken by another employee
      const { data: existingEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("email", form.email.trim())
        .neq("id", id)
        .single();

      if (existingEmployee) {
        throw new Error("Email is already registered to another employee");
      }

      const updateData = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || null,
        position: form.position?.trim() || null,
        department_id: form.department_id || null,
        hire_date: form.hire_date || null,

        employee_code: form.employee_code?.trim() || null,
        status: form.status,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      setSuccess("Employee updated successfully!");
      
      // Redirect after success
      setTimeout(() => {
        navigate("/admin/employees");
      }, 1500);

    } catch (err) {
      console.error("Error updating employee:", err);
      setError(err.message || "Failed to update employee");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/employees")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
        <p className="text-gray-600 mt-2">Update employee information</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
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
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Success!</p>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
        <div className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Full Name *"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                icon={<User className="w-4 h-4" />}
                placeholder="John Doe"
              />
              <FormField
                label="Email Address *"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                icon={<Mail className="w-4 h-4" />}
                placeholder="john@example.com"
              />
              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                icon={<Phone className="w-4 h-4" />}
                placeholder="+1 (555) 123-4567"
              />
             
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Position"
                name="position"
                type="text"
                value={form.position}
                onChange={handleChange}
                icon={<Briefcase className="w-4 h-4" />}
                placeholder="Software Engineer"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="department_id"
                    value={form.department_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <FormField
                label="Hire Date"
                name="hire_date"
                type="date"
                value={form.hire_date}
                onChange={handleChange}
                icon={<Calendar className="w-4 h-4" />}
              />
              <FormField
                label="Employee Code"
                name="employee_code"
                type="text"
                value={form.employee_code}
                onChange={handleChange}
                placeholder="EMP001"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/admin/employees")}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, name, type = "text", value, onChange, required = false, icon, placeholder, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          {...props}
        />
      </div>
    </div>
  );
}