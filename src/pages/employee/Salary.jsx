import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import {
  DollarSign,
  Calendar,
  Download,
  FileText,
  TrendingUp,
  CreditCard,
  Receipt,
  Building,
  User,
  AlertCircle
} from "lucide-react";

export default function Salary() {
  const [loading, setLoading] = useState(true);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [currentMonthPayroll, setCurrentMonthPayroll] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSalaryData();
  }, []);

  async function fetchSalaryData() {
    try {
      setLoading(true);
      setError("");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch employee details
      const { data: empData } = await supabase
        .from("employees")
        .select(`
          *,
          departments (name)
        `)
        .eq("user_id", user.id)
        .single();

      setEmployee(empData);

      // Fetch active salary structure
      const { data: salaryData } = await supabase
        .from("salary_structures")
        .select("*")
        .eq("employee_id", empData.id)
        .eq("is_active", true)
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();

      setSalaryStructure(salaryData);

      // Fetch payroll history (last 12 months)
      const { data: payrollData } = await supabase
        .from("payrolls")
        .select(`
          *,
          salary_structures (
            base_salary,
            tax_percentage,
            provident_fund_percentage
          )
        `)
        .eq("employee_id", empData.id)
        .order("month", { ascending: false })
        .limit(12);

      setPayrollHistory(payrollData || []);

      // Find current month payroll
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const currentPayroll = payrollData?.find(p => 
        p.month.slice(0, 7) === currentMonth.slice(0, 7)
      );
      setCurrentMonthPayroll(currentPayroll);

    } catch (error) {
      console.error("Error fetching salary data:", error);
      setError("Failed to load salary information");
    } finally {
      setLoading(false);
    }
  }

  function calculateNetSalary(structure) {
    if (!structure) return 0;
    
    const gross = structure.base_salary + 
                 (structure.housing_allowance || 0) + 
                 (structure.transport_allowance || 0) + 
                 (structure.medical_allowance || 0) + 
                 (structure.other_allowance || 0);
    
    const tax = (gross * (structure.tax_percentage || 0)) / 100;
    const pf = (gross * (structure.provident_fund_percentage || 0)) / 100;
    
    return gross - tax - pf;
  }

  async function downloadPayslip(payrollId) {
    try {
      // Generate payslip PDF (you'll need to implement this backend)
      alert("Payslip download feature coming soon!");
      // For now, show a preview
      const payroll = payrollHistory.find(p => p.id === payrollId);
      if (payroll) {
        // You can implement PDF generation here or call an API
        console.log("Download payslip for:", payroll);
      }
    } catch (error) {
      alert("Failed to download payslip: " + error.message);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function getStatusBadge(status) {
    const config = {
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      processed: { color: "bg-blue-100 text-blue-800", label: "Processed" },
      failed: { color: "bg-red-100 text-red-800", label: "Failed" }
    };
    
    const { color, label } = config[status] || config.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
        {label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Salary Information</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchSalaryData}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const netSalary = salaryStructure ? calculateNetSalary(salaryStructure) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Salary</h1>
        <p className="text-gray-600 mt-2">View your salary details and payslips</p>
      </div>

      {/* Current Month Status */}
      {currentMonthPayroll && (
        <div className="mb-8">
          <div className={`p-6 rounded-xl shadow ${
            currentMonthPayroll.status === 'paid' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
              : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {new Date(currentMonthPayroll.month).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })} Salary
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">
                    {formatCurrency(currentMonthPayroll.net_salary)}
                  </span>
                  {getStatusBadge(currentMonthPayroll.status)}
                </div>
                {currentMonthPayroll.payment_date && (
                  <p className="text-gray-600 mt-2">
                    Paid on {new Date(currentMonthPayroll.payment_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => downloadPayslip(currentMonthPayroll.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Download Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Salary Breakdown */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Salary Structure */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Current Salary Structure
              </h2>
              {salaryStructure && (
                <span className="text-sm text-gray-500">
                  Effective from {new Date(salaryStructure.effective_from).toLocaleDateString()}
                </span>
              )}
            </div>

            {salaryStructure ? (
              <div className="space-y-6">
                {/* Gross Salary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Gross Salary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.base_salary)}</span>
                    </div>
                    
                    {/* Allowances */}
                    {[
                      { label: "Housing Allowance", value: salaryStructure.housing_allowance },
                      { label: "Transport Allowance", value: salaryStructure.transport_allowance },
                      { label: "Medical Allowance", value: salaryStructure.medical_allowance },
                      { label: "Other Allowance", value: salaryStructure.other_allowance }
                    ].map((item, index) => (
                      item.value > 0 && (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(item.value)}
                          </span>
                        </div>
                      )
                    ))}
                    
                    <div className="flex justify-between border-t pt-3">
                      <span className="font-semibold">Total Gross</span>
                      <span className="font-bold">
                        {formatCurrency(
                          salaryStructure.base_salary + 
                          (salaryStructure.housing_allowance || 0) + 
                          (salaryStructure.transport_allowance || 0) + 
                          (salaryStructure.medical_allowance || 0) + 
                          (salaryStructure.other_allowance || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Deductions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({salaryStructure.tax_percentage}%)</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency((netSalary * salaryStructure.tax_percentage) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provident Fund ({salaryStructure.provident_fund_percentage}%)</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency((netSalary * salaryStructure.provident_fund_percentage) / 100)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t pt-3">
                      <span className="font-semibold">Total Deductions</span>
                      <span className="font-bold text-red-600">
                        -{formatCurrency(
                          (netSalary * salaryStructure.tax_percentage) / 100 +
                          (netSalary * salaryStructure.provident_fund_percentage) / 100
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-700">Net Take-Home Salary</h3>
                      <p className="text-sm text-gray-600">Per month</p>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(netSalary)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No salary structure found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Contact HR to set up your salary structure
                </p>
              </div>
            )}
          </div>

          {/* Bank Information */}
          {employee && (employee.bank_account || employee.bank_name) && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Bank Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Bank Name" value={employee.bank_name} />
                <InfoField label="Account Number" value={employee.bank_account} />
                <InfoField label="Account Holder" value={employee.name} />
                <div>
                  <p className="text-sm text-gray-500">Salary Payment Method</p>
                  <p className="font-medium">Direct Bank Transfer</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - History & Actions */}
        <div className="space-y-8">
          {/* Payroll History */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Payslips</h2>
            <div className="space-y-4">
              {payrollHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No payroll history</p>
              ) : (
                payrollHistory.map((payroll) => (
                  <div key={payroll.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {new Date(payroll.month).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(payroll.status)}
                          {payroll.payment_date && (
                            <span className="text-xs text-gray-500">
                              {new Date(payroll.payment_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadPayslip(payroll.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Download Payslip"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Net Salary</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(payroll.net_salary)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {payrollHistory.length > 0 && (
              <button
                onClick={() => {
                  // Navigate to full payroll history
                  alert("Full payroll history feature coming soon!");
                }}
                className="w-full mt-4 py-2 text-center text-blue-600 hover:text-blue-800 border-t border-gray-200 pt-4"
              >
                View All Payslips →
              </button>
            )}
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Tax Information</h2>
            {salaryStructure ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax Rate</span>
                    <span className="font-bold">{salaryStructure.tax_percentage}%</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Provident Fund</span>
                    <span className="font-bold">{salaryStructure.provident_fund_percentage}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Tax is calculated on gross salary. Please consult with your HR for detailed tax breakdown.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tax information available</p>
            )}
          </div>

          {/* Help & Support */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <div className="space-y-3">
              <button
                onClick={() => alert("Contact HR feature coming soon!")}
                className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium">Contact HR</span>
                <p className="text-sm text-gray-500 mt-1">
                  Questions about your salary or deductions
                </p>
              </button>
              <button
                onClick={() => alert("Dispute feature coming soon!")}
                className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium">Report Discrepancy</span>
                <p className="text-sm text-gray-500 mt-1">
                  Found an error in your salary?
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}