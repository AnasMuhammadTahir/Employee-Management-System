import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { 
  DollarSign, Calendar, FileText, Plus, Trash2, ArrowLeft,
  Download, Printer, Eye, AlertCircle, CheckCircle, Loader2,
  CreditCard, TrendingUp, Percent, Building, Briefcase, Users
} from "lucide-react";

export default function EmployeeSalary() {
  const { id: employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  
  const [form, setForm] = useState({
    base_salary: "",
    housing_allowance: "",
    transport_allowance: "",
    medical_allowance: "",
    other_allowance: "",
    tax_percentage: "5",
    provident_fund_percentage: "10",
    effective_from: new Date().toISOString().split('T')[0],
    notes: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
      fetchSalaryHistory();
    }
  }, [employeeId]);

  async function fetchEmployeeData() {
    try {
      setLoading(true);
      setError("");
      
      // Fetch employee details
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select(`
          *,
          departments (id, name)
          
        `)
        .eq("id", employeeId)
        .single();
      
      if (empError) throw empError;
      if (!empData) {
        setError("Employee not found");
        return;
      }

      setEmployee(empData);
      
      // Fetch active salary structure
      const { data: salaryData, error: salaryError } = await supabase
        .from("salary_structures")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("is_active", true)
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();
      
      if (salaryError && salaryError.code !== 'PGRST116') {
        console.error("Error fetching salary:", salaryError);
      }

      if (salaryData) {
        setCurrentSalary(salaryData);
        setForm({
          base_salary: salaryData.base_salary.toString(),
          housing_allowance: salaryData.housing_allowance?.toString() || "",
          transport_allowance: salaryData.transport_allowance?.toString() || "",
          medical_allowance: salaryData.medical_allowance?.toString() || "",
          other_allowance: salaryData.other_allowance?.toString() || "",
          tax_percentage: salaryData.tax_percentage?.toString() || "5",
          provident_fund_percentage: salaryData.provident_fund_percentage?.toString() || "10",
          effective_from: new Date().toISOString().split('T')[0],
          notes: salaryData.notes || ""
        });
      }
      
      // Fetch all salary structures
      const { data: structures, error: structuresError } = await supabase
        .from("salary_structures")
        .select("*")
        .eq("employee_id", employeeId)
        .order("effective_from", { ascending: false });
      
      if (structuresError) throw structuresError;
      setSalaryStructures(structures || []);
      
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSalaryHistory() {
    try {
      const { data, error } = await supabase
        .from("payrolls")
        .select(`
          *,
          salary_structures (
            base_salary
          )
        `)
        .eq("employee_id", employeeId)
        .order("month", { ascending: false })
        .limit(12);
      
      if (error) throw error;
      setSalaryHistory(data || []);
    } catch (error) {
      console.error("Error fetching salary history:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validate form
      if (!form.base_salary || parseFloat(form.base_salary) <= 0) {
        throw new Error("Base salary must be greater than 0");
      }

      if (!form.effective_from) {
        throw new Error("Effective date is required");
      }

      // Deactivate old salary structure if exists
      if (currentSalary && currentSalary.is_active) {
        const { error: deactivateError } = await supabase
          .from("salary_structures")
          .update({ 
            is_active: false,
            effective_to: new Date().toISOString().split('T')[0]
          })
          .eq("id", currentSalary.id);

        if (deactivateError) throw deactivateError;
      }

      // Create new salary structure
      const newSalaryStructure = {
        employee_id: employeeId,
        base_salary: parseFloat(form.base_salary),
        housing_allowance: parseFloat(form.housing_allowance) || 0,
        transport_allowance: parseFloat(form.transport_allowance) || 0,
        medical_allowance: parseFloat(form.medical_allowance) || 0,
        other_allowance: parseFloat(form.other_allowance) || 0,
        tax_percentage: parseFloat(form.tax_percentage),
        provident_fund_percentage: parseFloat(form.provident_fund_percentage),
        effective_from: form.effective_from,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from("salary_structures")
        .insert(newSalaryStructure)
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess("Salary structure updated successfully!");
      setCurrentSalary(data);
      fetchEmployeeData(); // Refresh data
      
      // Reset form for next entry
      setForm({
        base_salary: "",
        housing_allowance: "",
        transport_allowance: "",
        medical_allowance: "",
        other_allowance: "",
        tax_percentage: "5",
        provident_fund_percentage: "10",
        effective_from: new Date().toISOString().split('T')[0],
        notes: ""
      });

    } catch (err) {
      console.error("Error updating salary:", err);
      setError(err.message || "Failed to update salary structure");
    } finally {
      setSaving(false);
    }
  }

  function calculateTotal() {
    const base = parseFloat(form.base_salary) || 0;
    const housing = parseFloat(form.housing_allowance) || 0;
    const transport = parseFloat(form.transport_allowance) || 0;
    const medical = parseFloat(form.medical_allowance) || 0;
    const other = parseFloat(form.other_allowance) || 0;
    const taxPercent = parseFloat(form.tax_percentage) || 0;
    const pfPercent = parseFloat(form.provident_fund_percentage) || 0;
    
    const gross = base + housing + transport + medical + other;
    const tax = (gross * taxPercent) / 100;
    const pf = (gross * pfPercent) / 100;
    const net = gross - tax - pf;
    
    return { gross, tax, pf, net };
  }

  async function generatePayrollForMonth() {
    if (!currentSalary) {
      setError("No active salary structure found");
      return;
    }

    try {
      setGeneratingPayroll(true);
      setError("");
      
      const month = new Date().toISOString().split('T')[0].slice(0, 7); // YYYY-MM
      const total = calculateTotal();
      
      // Check if payroll already exists for this month
      const { data: existingPayroll } = await supabase
        .from("payrolls")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("month", month)
        .single();

      if (existingPayroll) {
        throw new Error(`Payroll for ${month} already exists`);
      }
      
      const payrollData = {
        employee_id: employeeId,
        salary_structure_id: currentSalary.id,
        month: month,
        basic_salary: currentSalary.base_salary,
        total_allowances: total.gross - currentSalary.base_salary,
        total_deductions: total.tax + total.pf,
        net_salary: total.net,
        status: 'pending',
        generated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from("payrolls")
        .insert(payrollData);

      if (insertError) throw insertError;
      
      setSuccess("Payroll generated successfully!");
      fetchSalaryHistory();
      
    } catch (err) {
      console.error("Error generating payroll:", err);
      setError(err.message || "Failed to generate payroll");
    } finally {
      setGeneratingPayroll(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate("/admin/employees")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ← Back to Employees
        </button>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/employees")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
            <div className="flex items-center gap-2 mt-2">
              <Users className="w-5 h-5 text-gray-400" />
              <p className="text-gray-600">
                {employee.name} • {employee.position}
              </p>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {employee.departments?.name}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => navigate(`/admin/employees/${employeeId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Eye className="w-4 h-4" />
              View Profile
            </button>
          </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Salary Structure Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Salary Summary */}
          {currentSalary && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Current Active Salary
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Active since {formatDate(currentSalary.effective_from)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                  label="Base Salary" 
                  value={formatCurrency(currentSalary.base_salary)}
                  icon={<DollarSign className="w-4 h-4" />}
                />
                <StatCard 
                  label="Allowances" 
                  value={formatCurrency(
                    (currentSalary.housing_allowance || 0) + 
                    (currentSalary.transport_allowance || 0) + 
                    (currentSalary.medical_allowance || 0) + 
                    (currentSalary.other_allowance || 0)
                  )}
                  icon={<TrendingUp className="w-4 h-4" />}
                />
                <StatCard 
                  label="Deductions" 
                  value={formatCurrency(
                    (total.gross * (currentSalary.tax_percentage || 0) / 100) +
                    (total.gross * (currentSalary.provident_fund_percentage || 0) / 100)
                  )}
                  icon={<Percent className="w-4 h-4" />}
                  isDeduction={true}
                />
                <StatCard 
                  label="Net Salary" 
                  value={formatCurrency(total.net)}
                  icon={<FileText className="w-4 h-4" />}
                  isNet={true}
                />
              </div>
            </div>
          )}

          {/* Salary Structure Form */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
              {currentSalary ? "Update Salary Structure" : "Set Initial Salary"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Salary *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.base_salary}
                      onChange={(e) => setForm({...form, base_salary: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective From *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.effective_from}
                      onChange={(e) => setForm({...form, effective_from: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Allowances
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Housing Allowance", key: "housing_allowance", icon: <Building className="w-4 h-4" /> },
                    { label: "Transport Allowance", key: "transport_allowance", icon: <Briefcase className="w-4 h-4" /> },
                    { label: "Medical Allowance", key: "medical_allowance", icon: <Users className="w-4 h-4" /> },
                    { label: "Other Allowance", key: "other_allowance", icon: <DollarSign className="w-4 h-4" /> }
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-sm text-gray-600 mb-2 flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                          value={form[item.key]}
                          onChange={(e) => setForm({...form, [item.key]: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-red-600" />
                  Deductions (%)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Tax Percentage
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="30"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        value={form.tax_percentage}
                        onChange={(e) => setForm({...form, tax_percentage: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Provident Fund
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        value={form.provident_fund_percentage}
                        onChange={(e) => setForm({...form, provident_fund_percentage: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this salary structure..."
                />
              </div>

              {/* Salary Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-gray-800">Salary Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Salary:</span>
                    <span className="font-medium">{formatCurrency(total.gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Deduction ({form.tax_percentage}%):</span>
                    <span className="text-red-600">-{formatCurrency(total.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provident Fund ({form.provident_fund_percentage}%):</span>
                    <span className="text-red-600">-{formatCurrency(total.pf)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Net Salary:</span>
                    <span className="font-bold text-green-600">{formatCurrency(total.net)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                      <FileText className="w-4 h-4" />
                      {currentSalary ? "Update Salary" : "Save Salary Structure"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - History & Actions */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={generatePayrollForMonth}
                disabled={!currentSalary || generatingPayroll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPayroll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Generate This Month's Payroll
              </button>
              <button
                onClick={() => navigate(`/admin/employees/${employeeId}/salary/history`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                View Full History
              </button>
              <button
                onClick={() => navigate(`/admin/payroll?employee=${employeeId}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <DollarSign className="w-4 h-4" />
                View All Payrolls
              </button>
            </div>
          </div>

          {/* Recent Salary History */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Salary History</h3>
            <div className="space-y-4">
              {salaryHistory.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No salary history yet</p>
                </div>
              ) : (
                salaryHistory.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">
                        {new Date(record.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                        {record.payment_date && (
                          <span className="text-xs text-gray-500">
                            Paid: {formatDate(record.payment_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(record.net_salary)}</p>
                      <p className="text-sm text-gray-500">
                        Basic: {formatCurrency(record.basic_salary)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Salary Structure History */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Salary Structure History</h3>
            <div className="space-y-3">
              {salaryStructures.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No previous structures</p>
              ) : (
                salaryStructures.slice(0, 4).map((structure) => (
                  <div key={structure.id} className={`p-3 rounded-lg ${
                    structure.is_active ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{formatCurrency(structure.base_salary)}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(structure.effective_from)}
                          {structure.effective_to && ` - ${formatDate(structure.effective_to)}`}
                        </p>
                      </div>
                      {structure.is_active && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              {salaryStructures.length > 4 && (
                <button
                  onClick={() => navigate(`/admin/employees/${employeeId}/salary/structures`)}
                  className="w-full text-center text-blue-600 hover:text-blue-800 text-sm py-2"
                >
                  View all {salaryStructures.length} structures →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isNet = false, isDeduction = false }) {
  return (
    <div className={`p-4 rounded-lg ${isNet ? 'bg-green-50 border border-green-200' : isDeduction ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className={`text-xl font-bold ${isNet ? 'text-green-600' : isDeduction ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}