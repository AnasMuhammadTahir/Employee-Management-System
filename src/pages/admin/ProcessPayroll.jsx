import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import {
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Clock,
  Filter,
  Download
} from "lucide-react";

export default function ProcessPayroll() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) + "-01"
  );
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, departmentFilter]);

  async function fetchEmployees() {
    try {
      setLoading(true);
      
      const { data } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          email,
          departments (name),
          salary_structures!inner (
            base_salary,
            housing_allowance,
            transport_allowance,
            medical_allowance,
            other_allowance,
            tax_percentage,
            provident_fund_percentage,
            is_active
          )
        `)
        .eq("salary_structures.is_active", true)
        .order("name");

      setEmployees(data || []);
      setFilteredEmployees(data || []);

    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .order("name");
    setDepartments(data || []);
  }

  function filterEmployees() {
    let filtered = [...employees];

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => 
        emp.departments?.name === departmentFilter
      );
    }

    setFilteredEmployees(filtered);
  }

  function calculateNetSalary(salaryStructure) {
    if (!salaryStructure) return 0;
    
    const gross = salaryStructure.base_salary + 
                 (salaryStructure.housing_allowance || 0) + 
                 (salaryStructure.transport_allowance || 0) + 
                 (salaryStructure.medical_allowance || 0) + 
                 (salaryStructure.other_allowance || 0);
    
    const tax = (gross * (salaryStructure.tax_percentage || 0)) / 100;
    const pf = (gross * (salaryStructure.provident_fund_percentage || 0)) / 100;
    
    return gross - tax - pf;
  }

  function generatePreview() {
    if (selectedEmployees.size === 0) {
      setError("Please select at least one employee");
      return;
    }

    const selectedEmpIds = Array.from(selectedEmployees);
    const selectedEmployeesData = employees.filter(emp => 
      selectedEmpIds.includes(emp.id)
    );

    const totalBasic = selectedEmployeesData.reduce((sum, emp) => 
      sum + (emp.salary_structures?.[0]?.base_salary || 0), 0
    );

    const totalNet = selectedEmployeesData.reduce((sum, emp) => 
      sum + calculateNetSalary(emp.salary_structures?.[0]), 0
    );

    setPreviewData({
      employeeCount: selectedEmployeesData.length,
      totalBasic,
      totalNet,
      employees: selectedEmployeesData.map(emp => ({
        id: emp.id,
        name: emp.name,
        department: emp.departments?.name,
        basicSalary: emp.salary_structures?.[0]?.base_salary || 0,
        netSalary: calculateNetSalary(emp.salary_structures?.[0])
      }))
    });
    setError("");
  }

  async function processPayroll() {
    if (!previewData || !selectedMonth) {
      setError("Please generate preview first and select a month");
      return;
    }

    if (!window.confirm(`Process payroll for ${previewData.employeeCount} employees?`)) {
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const payrolls = previewData.employees.map(emp => {
        const salaryStructure = employees.find(e => e.id === emp.id)?.salary_structures?.[0];
        
        return {
          employee_id: emp.id,
          salary_structure_id: salaryStructure?.id,
          month: selectedMonth,
          basic_salary: emp.basicSalary,
          total_allowances: (salaryStructure?.housing_allowance || 0) + 
                           (salaryStructure?.transport_allowance || 0) + 
                           (salaryStructure?.medical_allowance || 0) + 
                           (salaryStructure?.other_allowance || 0),
          total_deductions: emp.basicSalary - emp.netSalary,
          net_salary: emp.netSalary,
          status: "processed",
          notes: `Processed on ${new Date().toLocaleDateString()}`
        };
      });

      // Insert payroll records
      const { error } = await supabase
        .from("payrolls")
        .insert(payrolls);

      if (error) throw error;

      setSuccess(`Payroll processed successfully for ${previewData.employeeCount} employees!`);
      setPreviewData(null);
      setSelectedEmployees(new Set());

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/admin/payroll");
      }, 3000);

    } catch (err) {
      setError("Failed to process payroll: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  function toggleEmployee(id) {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  }

  function toggleSelectAll() {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      const allIds = new Set(filteredEmployees.map(emp => emp.id));
      setSelectedEmployees(allIds);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Process Payroll</h1>
          <p className="text-gray-600 mt-2">Generate payroll for selected employees</p>
        </div>
        <button
          onClick={() => navigate("/admin/payroll")}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Payroll
        </button>
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
        {/* Left Column - Employee Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select Employees</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">
                    {filteredEmployees.length} employees
                  </span>
                </div>
              </div>

              {/* Month Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payroll Month
                </label>
                <input
                  type="month"
                  value={selectedMonth.slice(0, 7)}
                  onChange={(e) => setSelectedMonth(e.target.value + "-01")}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">
                    Select All ({selectedEmployees.size} selected)
                  </span>
                </label>
                <button
                  onClick={generatePreview}
                  disabled={selectedEmployees.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Generate Preview
                </button>
              </div>
            </div>

            {/* Employee List */}
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No employees found</p>
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const netSalary = calculateNetSalary(emp.salary_structures?.[0]);
                  
                  return (
                    <div key={emp.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.has(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <h3 className="font-medium">{emp.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span>{emp.departments?.name}</span>
                              <span>•</span>
                              <span>{emp.email}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm text-gray-500">Monthly Salary</p>
                              <p className="font-bold text-lg">{formatCurrency(netSalary)}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Salary Breakdown (on hover or expand) */}
                      {selectedEmployees.has(emp.id) && (
                        <div className="mt-4 pl-10 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Basic</p>
                              <p className="font-medium">{formatCurrency(emp.salary_structures?.[0]?.base_salary || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Allowances</p>
                              <p className="font-medium text-green-600">
                                +{formatCurrency(
                                  (emp.salary_structures?.[0]?.housing_allowance || 0) + 
                                  (emp.salary_structures?.[0]?.transport_allowance || 0) + 
                                  (emp.salary_structures?.[0]?.medical_allowance || 0) + 
                                  (emp.salary_structures?.[0]?.other_allowance || 0)
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Deductions</p>
                              <p className="font-medium text-red-600">
                                -{formatCurrency((emp.salary_structures?.[0]?.base_salary || 0) - netSalary)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Net</p>
                              <p className="font-bold text-lg">{formatCurrency(netSalary)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Actions */}
        <div className="space-y-8">
          {/* Preview Summary */}
          {previewData ? (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Payroll Preview</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Payroll Month</span>
                    <span className="font-bold">
                      {new Date(selectedMonth).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Processing Date</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Employees</p>
                      <p className="text-sm text-gray-500">Selected for payroll</p>
                    </div>
                    <span className="text-2xl font-bold">{previewData.employeeCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Basic</p>
                      <p className="text-sm text-gray-500">Sum of basic salaries</p>
                    </div>
                    <span className="text-xl font-bold">{formatCurrency(previewData.totalBasic)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-semibold">Total Payout</p>
                      <p className="text-sm text-gray-500">Net amount to be paid</p>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(previewData.totalNet)}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={processPayroll}
                    disabled={processing}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Payroll...
                      </span>
                    ) : (
                      "Confirm & Process Payroll"
                    )}
                  </button>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    This will create payroll records for all selected employees
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Payroll Preview</h2>
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No preview generated yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Select employees and click "Generate Preview"
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Employees</p>
                  <p className="text-sm text-gray-500">Active with salary structure</p>
                </div>
                <span className="text-lg font-bold">{employees.length}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Average Salary</p>
                  <p className="text-sm text-gray-500">Monthly net salary</p>
                </div>
                <span className="text-lg font-bold">
                  {formatCurrency(
                    employees.reduce((sum, emp) => 
                      sum + calculateNetSalary(emp.salary_structures?.[0]), 0
                    ) / (employees.length || 1)
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Departments</p>
                  <p className="text-sm text-gray-500">With active employees</p>
                </div>
                <span className="text-lg font-bold">
                  {[...new Set(employees.map(e => e.departments?.name).filter(Boolean))].length}
                </span>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <div className="space-y-3">
              <button
                onClick={() => alert("Payroll guide coming soon!")}
                className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium">Payroll Processing Guide</span>
                <p className="text-sm text-gray-500 mt-1">
                  Step-by-step instructions
                </p>
              </button>
              <button
                onClick={() => alert("Tax info coming soon!")}
                className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium">Tax & Deductions Info</span>
                <p className="text-sm text-gray-500 mt-1">
                  Understanding payroll calculations
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}