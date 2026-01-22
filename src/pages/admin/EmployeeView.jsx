import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { 
  User, Calendar, Building, DollarSign, Mail, 
  Phone, Briefcase, CreditCard, FileText, MapPin,
  TrendingUp, Clock, Percent, AlertCircle, Loader2,
  Edit2, Download, Printer, ExternalLink, Shield, Users,
  ArrowLeft, Home, Smartphone, Heart
} from "lucide-react";

export default function EmployeeView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [payrollStats, setPayrollStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
    }
  }, [id]);

  async function fetchEmployeeDetails() {
    try {
      setLoading(true);
      setError("");
      
      // Fix 1: Removed the trailing comma and empty line
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select(`
          *,
          departments (id, name)
        `)
        .eq("id", id)
        .single();

      if (empError) throw empError;
      if (!empData) {
        setError("Employee not found");
        return;
      }

      setEmployee(empData);

      // Fetch latest salary structure
      const { data: salaryData, error: salaryError } = await supabase
        .from("salary_structures")
        .select("*")
        .eq("employee_id", id)
        .eq("is_active", true)
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();

      if (salaryError && salaryError.code !== 'PGRST116') {
        console.error("Error fetching salary:", salaryError);
      }
      setSalary(salaryData || null);

      // Fetch leave balances for current year
      const currentYear = new Date().getFullYear();
      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_types (name, is_paid)
        `)
        .eq("employee_id", id)
        .eq("year", currentYear);

      if (leaveError) console.error("Error fetching leave balance:", leaveError);
      setLeaveBalance(leaveData || []);

      // Fetch recent leaves
      const { data: leavesData, error: leavesError } = await supabase
        .from("leaves")
        .select(`
          *,
          leave_types (name)
        `)
        .eq("employee_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (leavesError) console.error("Error fetching leaves:", leavesError);
      setRecentLeaves(leavesData || []);

      // Fetch payroll statistics
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      const { data: payrollData, error: payrollError } = await supabase
        .from("payrolls")
        .select("*")
        .eq("employee_id", id)
        .eq("month", currentYearMonth)
        .single();

      if (payrollError && payrollError.code !== 'PGRST116') {
        console.error("Error fetching payroll:", payrollError);
      }
      setPayrollStats(payrollData || {});

    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  }

  function calculateNetSalary() {
    if (!salary) return 0;
    
    const gross = salary.base_salary + 
                 (salary.housing_allowance || 0) + 
                 (salary.transport_allowance || 0) + 
                 (salary.medical_allowance || 0) + 
                 (salary.other_allowance || 0);
    
    const tax = (gross * (salary.tax_percentage || 0)) / 100;
    const pf = (gross * (salary.provident_fund_percentage || 0)) / 100;
    
    return gross - tax - pf;
  }

  function calculateTenure() {
    if (!employee?.hire_date) return '—';
    
    const hireDate = new Date(employee.hire_date);
    const now = new Date();
    
    let years = now.getFullYear() - hireDate.getFullYear();
    let months = now.getMonth() - hireDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
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

  function getStatusColor(status) {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!employee || error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The requested employee does not exist."}</p>
          <button
            onClick={() => navigate("/admin/employees")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  const netSalary = calculateNetSalary();
  const tenure = calculateTenure();

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
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4">
              {employee.avatar_url ? (
                <img 
                  src={employee.avatar_url} 
                  alt={employee.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status?.replace('_', ' ') || 'active'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <p className="text-gray-600">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    {employee.position}
                  </p>
                  <span className="text-gray-400">•</span>
                  <p className="text-gray-600">
                    <Building className="w-4 h-4 inline mr-1" />
                    {employee.departments?.name || 'No department'}
                  </p>
                  <span className="text-gray-400">•</span>
                  <p className="text-gray-600">
                    ID: {employee.employee_code || employee.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/admin/employees/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => navigate(`/admin/employees/${id}/salary`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <DollarSign className="w-4 h-4" />
              Manage Salary
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal & Salary Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem 
                icon={<Mail className="w-4 h-4" />} 
                label="Email" 
                value={employee.email} 
              />
              <InfoItem 
                icon={<Phone className="w-4 h-4" />} 
                label="Phone" 
                value={employee.phone || '—'} 
              />
              <InfoItem 
                icon={<Calendar className="w-4 h-4" />} 
                label="Date of Birth" 
                value={formatDate(employee.dob)} 
              />
              <InfoItem 
                icon={<Briefcase className="w-4 h-4" />} 
                label="Position" 
                value={employee.position || '—'} 
              />
              <InfoItem 
                icon={<Building className="w-4 h-4" />} 
                label="Department" 
                value={employee.departments?.name || '—'} 
              />
              <InfoItem 
                icon={<Calendar className="w-4 h-4" />} 
                label="Hire Date" 
                value={formatDate(employee.hire_date)} 
              />
              <InfoItem 
                icon={<Clock className="w-4 h-4" />} 
                label="Tenure" 
                value={tenure} 
              />
              <InfoItem 
                icon={<Shield className="w-4 h-4" />} 
                label="Employment Type" 
                value={employee.employment_type?.replace('_', ' ').toUpperCase() || '—'} 
              />
            </div>

            {/* Additional Contact Info */}
            {(employee.address || employee.bank_account) && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {employee.address && (
                    <InfoItem 
                      icon={<Home className="w-4 h-4" />} 
                      label="Address" 
                      value={employee.address} 
                      isFullWidth={true}
                    />
                  )}
                  {employee.emergency_contact && (
                    <InfoItem 
                      icon={<Heart className="w-4 h-4" />} 
                      label="Emergency Contact" 
                      value={employee.emergency_contact} 
                    />
                  )}
                  {employee.bank_name && (
                    <InfoItem 
                      icon={<CreditCard className="w-4 h-4" />} 
                      label="Bank Name" 
                      value={employee.bank_name} 
                    />
                  )}
                  {employee.bank_account && (
                    <InfoItem 
                      icon={<CreditCard className="w-4 h-4" />} 
                      label="Bank Account" 
                      value={`••••${employee.bank_account.slice(-4)}`} 
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Salary Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Salary Information
              </h2>
              <button
                onClick={() => navigate(`/admin/employees/${id}/salary`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DollarSign className="w-4 h-4" />
                Manage Salary
              </button>
            </div>

            {salary ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <SalaryCard 
                    label="Base Salary" 
                    value={formatCurrency(salary.base_salary)} 
                    icon={<DollarSign className="w-4 h-4" />}
                  />
                  <SalaryCard 
                    label="Total Allowances" 
                    value={formatCurrency(
                      (salary.housing_allowance || 0) + 
                      (salary.transport_allowance || 0) + 
                      (salary.medical_allowance || 0) + 
                      (salary.other_allowance || 0)
                    )}
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                  <SalaryCard 
                    label="Net Salary" 
                    value={formatCurrency(netSalary)}
                    icon={<FileText className="w-4 h-4" />}
                    isNet={true}
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Allowances Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <AllowanceItem label="Housing" value={salary.housing_allowance || 0} />
                      <AllowanceItem label="Transport" value={salary.transport_allowance || 0} />
                      <AllowanceItem label="Medical" value={salary.medical_allowance || 0} />
                      <AllowanceItem label="Other" value={salary.other_allowance || 0} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DeductionItem label="Tax" percentage={salary.tax_percentage || 0} />
                      <DeductionItem label="Provident Fund" percentage={salary.provident_fund_percentage || 0} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div>
                      <p>Effective from {formatDate(salary.effective_from)}</p>
                      {payrollStats.status && (
                        <p className="mt-1">
                          This month's payroll: {' '}
                          <span className={`font-medium ${
                            payrollStats.status === 'paid' ? 'text-green-600' : 
                            payrollStats.status === 'pending' ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {payrollStats.status}
                          </span>
                          {payrollStats.net_salary && (
                            <span className="ml-2">
                              ({formatCurrency(payrollStats.net_salary)})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/admin/payroll?employee=${id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Payroll History →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No salary structure set for this employee</p>
                <button
                  onClick={() => navigate(`/admin/employees/${id}/salary`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Set Salary Structure
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Leave & Actions */}
        <div className="space-y-8">
          {/* Manager Information */}
          {employee.managers && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Reports To</h2>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{employee.managers.name}</p>
                  <p className="text-sm text-gray-500">{employee.managers.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leave Balance */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Leave Balance</h2>
              <button
                onClick={() => navigate(`/admin/leaves?employee=${id}`)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {leaveBalance.length > 0 ? (
                leaveBalance.map((balance) => (
                  <div key={balance.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{balance.leave_types?.name}</p>
                      <p className="text-sm text-gray-500">
                        {balance.leave_types?.is_paid ? 'Paid Leave' : 'Unpaid Leave'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{balance.remaining}</p>
                      <p className="text-sm text-gray-500">
                        {balance.used} used of {balance.total_allocated}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No leave balance found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Leaves */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Leaves</h2>
              <button
                onClick={() => navigate(`/admin/leaves?employee=${id}`)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {recentLeaves.length > 0 ? (
                recentLeaves.map((leave) => (
                  <div key={leave.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{leave.leave_types?.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    {leave.reason && (
                      <p className="text-sm text-gray-600 mt-2 truncate">{leave.reason}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No recent leaves</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/admin/employees/${id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Edit2 className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="font-medium">Edit Employee Details</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Update personal information
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate(`/admin/employees/${id}/salary`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="font-medium">Manage Salary & Payroll</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Update salary structure and generate payroll
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate(`/admin/leaves?employee=${id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="font-medium">Manage Leaves</span>
                  <p className="text-sm text-gray-500 mt-1">
                    View and approve leave requests
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate(`/admin/payroll?employee=${id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="font-medium">View Payroll History</span>
                  <p className="text-sm text-gray-500 mt-1">
                    View all payroll records
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, isFullWidth = false }) {
  return (
    <div className={`flex items-start gap-3 ${isFullWidth ? 'md:col-span-2' : ''}`}>
      <div className="text-gray-400 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function SalaryCard({ label, value, icon, isNet = false }) {
  return (
    <div className={`p-4 rounded-lg ${isNet ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className={`text-xl font-bold ${isNet ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

function AllowanceItem({ label, value }) {
  return (
    <div className="p-3 bg-blue-50 rounded-lg">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="font-medium">{formatCurrency(value)}</p>
    </div>
  );
}

function DeductionItem({ label, percentage }) {
  return (
    <div className="p-3 bg-red-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Percent className="w-4 h-4 text-red-600" />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <p className="font-medium text-red-600">{percentage}%</p>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}