import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function Payroll() {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalAmount: 0,
    employeesPaid: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    month: '',
    department: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  useEffect(() => {
    filterPayrolls();
  }, [payrolls, filters, searchTerm]);

  async function fetchPayrollData() {
    try {
      setLoading(true);
      
      // Fetch payrolls with employee and department info
      const { data } = await supabase
        .from("payrolls")
        .select(`
          *,
          employees (
            name,
            email,
            departments (name)
          ),
          salary_structures (
            base_salary,
            tax_percentage
          )
        `)
        .order("month", { ascending: false });

      setPayrolls(data || []);
      
      // Calculate stats
      if (data) {
        const totalPaid = data.filter(p => p.status === 'paid').length;
        const totalPending = data.filter(p => p.status === 'pending').length;
        const totalAmount = data.reduce((sum, p) => sum + p.net_salary, 0);
        const employeesPaid = [...new Set(data.filter(p => p.status === 'paid').map(p => p.employee_id))].length;
        
        setStats({ totalPaid, totalPending, totalAmount, employeesPaid });
      }

      // Fetch departments for filter
      const { data: depts } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      setDepartments(depts || []);

    } catch (error) {
      console.error("Error fetching payroll data:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterPayrolls() {
    let filtered = [...payrolls];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Apply month filter
    if (filters.month) {
      filtered = filtered.filter(p => 
        p.month.slice(0, 7) === filters.month
      );
    }

    // Apply department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(p => 
        p.employees?.departments?.name === filters.department
      );
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.employees?.name.toLowerCase().includes(term) ||
        p.employees?.email.toLowerCase().includes(term)
      );
    }

    setFilteredPayrolls(filtered);
  }

  async function updatePayrollStatus(id, status) {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid') {
      updates.payment_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from("payrolls")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert('Error updating payroll: ' + error.message);
      return;
    }

    fetchPayrollData();
  }

  function exportToCSV() {
    const headers = ['Employee', 'Department', 'Month', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Payment Date'];
    const csvData = filteredPayrolls.map(p => [
      p.employees?.name,
      p.employees?.departments?.name,
      new Date(p.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      p.basic_salary,
      p.total_allowances,
      p.total_deductions,
      p.net_salary,
      p.status,
      p.payment_date || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-2">Manage employee payroll and payments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/payroll/process")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DollarSign className="w-4 h-4" />
            Process Payroll
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold mt-2">{stats.totalPaid}</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold mt-2">{stats.totalPending}</p>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Employees Paid</p>
              <p className="text-2xl font-bold mt-2">{stats.employeesPaid}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by employee name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="border border-gray-300 rounded-lg px-4 py-2"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          
          <input
            type="month"
            className="border border-gray-300 rounded-lg px-4 py-2"
            value={filters.month}
            onChange={(e) => setFilters({...filters, month: e.target.value})}
          />
        </div>

        <div className="mt-4">
          <select
            className="border border-gray-300 rounded-lg px-4 py-2"
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Month</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Basic Salary</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Net Salary</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No payroll records found</p>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <>
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{payroll.employees?.name}</p>
                          <p className="text-sm text-gray-500">{payroll.employees?.email}</p>
                          <p className="text-xs text-gray-400">{payroll.employees?.departments?.name}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {new Date(payroll.month).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="font-medium">{formatCurrency(payroll.basic_salary)}</span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg text-green-600">
                          {formatCurrency(payroll.net_salary)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          payroll.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : payroll.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : payroll.status === 'processed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                        </span>
                        {payroll.payment_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid: {new Date(payroll.payment_date).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {payroll.status === 'pending' && (
                            <button
                              onClick={() => updatePayrollStatus(payroll.id, 'paid')}
                              className="text-green-600 hover:text-green-800"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedRow(expandedRow === payroll.id ? null : payroll.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRow === payroll.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRow === payroll.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Salary Breakdown</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Basic Salary:</span>
                                  <span>{formatCurrency(payroll.basic_salary)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Allowances:</span>
                                  <span className="text-green-600">+{formatCurrency(payroll.total_allowances)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Deductions:</span>
                                  <span className="text-red-600">-{formatCurrency(payroll.total_deductions)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-2">
                                  <span>Net Salary:</span>
                                  <span>{formatCurrency(payroll.net_salary)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Payment Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Payment Method:</span>
                                  <span>Bank Transfer</span>
                                </div>
                                {payroll.payment_date && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Date:</span>
                                    <span>{new Date(payroll.payment_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Created:</span>
                                  <span>{new Date(payroll.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Actions</h4>
                              <div className="space-y-2">
                                <button
                                  onClick={() => downloadPayslip(payroll.id)}
                                  className="w-full text-left px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  Download Payslip
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/employees/${payroll.employee_id}/salary`)}
                                  className="w-full text-left px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  View Salary Structure
                                </button>
                                {payroll.status !== 'paid' && (
                                  <button
                                    onClick={() => updatePayrollStatus(payroll.id, 'paid')}
                                    className="w-full text-left px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function downloadPayslip(payrollId) {
  alert("Payslip download feature coming soon!");
}