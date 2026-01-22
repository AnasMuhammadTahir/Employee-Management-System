import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { Search, Filter, Download, Eye, MoreVertical, Calendar, User, DollarSign, FileText, AlertCircle, Loader } from "lucide-react";

export default function AdminPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: "",
    employee: "",
    status: ""
  });
  const [viewMode, setViewMode] = useState("list");
  const [bulkActions, setBulkActions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [filters.year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, employee_id, department")
        .order("full_name");

      if (employeesError) throw employeesError;

      // Build query for payslips
      let query = supabase
        .from("payslips")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            employee_id,
            department
          )
        `)
        .eq("year", filters.year);

      if (filters.month) {
        query = query.eq("month", filters.month);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.employee) {
        query = query.eq("user_id", filters.employee);
      }

      query = query.order("created_at", { ascending: false });

      const { data: payslipsData, error: payslipsError } = await query;

      if (payslipsError) throw payslipsError;

      setEmployees(employeesData || []);
      setPayslips(payslipsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslip = async (employeeId, month, year) => {
    try {
      // Find employee data
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        alert("Employee not found");
        return;
      }

      // Calculate salary (you would have your own logic here)
      const basicSalary = 3000; // Example - get from employee data
      const allowances = 500;
      const deductions = 200;
      const netSalary = basicSalary + allowances - deductions;

      const { data, error } = await supabase
        .from("payslips")
        .insert({
          user_id: employeeId,
          month: month,
          year: year,
          basic_salary: basicSalary,
          allowances: allowances,
          deductions: deductions,
          net_salary: netSalary,
          status: "pending",
          payment_date: null
        })
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      alert("Payslip generated successfully!");
    } catch (error) {
      console.error("Error generating payslip:", error);
      alert("Failed to generate payslip");
    }
  };

  const handleUpdateStatus = async (payslipId, status) => {
    try {
      const { error } = await supabase
        .from("payslips")
        .update({ 
          status: status,
          payment_date: status === "paid" ? new Date().toISOString() : null
        })
        .eq("id", payslipId);

      if (error) throw error;

      await fetchData();
      alert(`Status updated to ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Check if payslips already exist for this month
      const { data: existingPayslips } = await supabase
        .from("payslips")
        .select("user_id")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      const existingUserIds = existingPayslips?.map(p => p.user_id) || [];

      // Get employees without payslips for this month
      const employeesToProcess = employees.filter(
        emp => !existingUserIds.includes(emp.id) && emp.role === 'employee'
      );

      if (employeesToProcess.length === 0) {
        alert("All employees already have payslips for this month");
        return;
      }

      // Generate payslips for each employee
      for (const employee of employeesToProcess) {
        const basicSalary = 3000; // Example - get from employee data
        const allowances = 500;
        const deductions = 200;
        const netSalary = basicSalary + allowances - deductions;

        await supabase
          .from("payslips")
          .insert({
            user_id: employee.id,
            month: currentMonth,
            year: currentYear,
            basic_salary: basicSalary,
            allowances: allowances,
            deductions: deductions,
            net_salary: netSalary,
            status: "pending",
            notes: `Auto-generated for ${employee.full_name}`
          });
      }

      await fetchData();
      alert(`Generated ${employeesToProcess.length} payslips successfully!`);
    } catch (error) {
      console.error("Error in bulk generate:", error);
      alert("Failed to generate payslips");
    }
  };

  const handleDownloadPayslip = async (payslipId, employeeName, month, year) => {
    try {
      const payslip = payslips.find(p => p.id === payslipId);
      if (!payslip) {
        alert("Payslip not found");
        return;
      }

      const content = `
        PAYSLIP
        =======
        
        Employee: ${employeeName || 'N/A'}
        Period: ${month}/${year}
        
        Earnings:
        ---------
        Basic Salary: $${payslip.basic_salary || 0}
        Allowances: $${payslip.allowances || 0}
        
        Deductions:
        -----------
        Deductions: $${payslip.deductions || 0}
        
        Summary:
        --------
        Net Salary: $${payslip.net_salary || 0}
        
        Status: ${payslip.status || 'N/A'}
        Generated: ${payslip.created_at ? new Date(payslip.created_at).toLocaleDateString() : 'N/A'}
      `;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${employeeName || 'unknown'}-${month}-${year}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading payslip:", error);
      alert("Failed to download payslip");
    }
  };

  const getMonthName = (monthNumber) => {
    if (!monthNumber) return "N/A";
    try {
      const date = new Date();
      date.setMonth(monthNumber - 1);
      return date.toLocaleString('default', { month: 'long' });
    } catch {
      return "Invalid month";
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status.toLowerCase()) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateNetSalary = (payslip) => {
    if (!payslip) return 0;
    const basic = payslip.basic_salary || 0;
    const allowances = payslip.allowances || 0;
    const deductions = payslip.deductions || 0;
    return basic + allowances - deductions;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
          <button
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payslips Management</h1>
              <p className="text-gray-600 mt-2">Manage and generate employee payslips</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkGenerate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <DollarSign size={20} className="mr-2" />
                Bulk Generate
              </button>
              <button
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {viewMode === "list" ? "Grid View" : "List View"}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: parseInt(e.target.value) || new Date().getFullYear()})}
                className="w-full px-3 py-2 border rounded"
              >
                {[2022, 2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({...filters, month: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({...filters, employee: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || emp.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payslips</p>
                <p className="text-2xl font-bold text-gray-900">{payslips.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {payslips.filter(p => p.status === "paid" && p.month === new Date().getMonth() + 1).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payslips.filter(p => p.status === "pending").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Payslips List/Grid */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payslips.length > 0 ? (
                    payslips.map(payslip => {
                      const employeeName = payslip.profiles?.full_name || payslip.profiles?.email || 'Unknown';
                      const employeeId = payslip.profiles?.employee_id || 'N/A';
                      
                      return (
                        <tr key={payslip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={20} className="text-gray-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {employeeName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {employeeId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getMonthName(payslip.month)} {payslip.year}</div>
                            <div className="text-sm text-gray-500">
                              Generated: {payslip.created_at ? new Date(payslip.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-green-600">
                              ${calculateNetSalary(payslip).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Basic: ${(payslip.basic_salary || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payslip.status)}`}>
                              {(payslip.status || 'pending').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedPayslip(payslip)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleDownloadPayslip(
                                  payslip.id,
                                  employeeName,
                                  payslip.month,
                                  payslip.year
                                )}
                                className="text-green-600 hover:text-green-900"
                                title="Download"
                              >
                                <Download size={18} />
                              </button>
                              <select
                                value={payslip.status || 'pending'}
                                onChange={(e) => handleUpdateStatus(payslip.id, e.target.value)}
                                className="text-sm border rounded px-2 py-1"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <FileText size={48} className="mx-auto" />
                        </div>
                        <p className="text-gray-900 font-medium">No payslips found</p>
                        <p className="text-gray-600 mt-1">
                          {filters.month || filters.employee || filters.status ? 
                            "Try adjusting your filters" : 
                            "Generate your first payslip"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payslips.length > 0 ? (
              payslips.map(payslip => {
                const employeeName = payslip.profiles?.full_name || payslip.profiles?.email || 'Unknown';
                
                return (
                  <div key={payslip.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{employeeName}</h3>
                        <p className="text-sm text-gray-500">{payslip.profiles?.employee_id || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{payslip.profiles?.department || 'N/A'}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(payslip.status)}`}>
                        {(payslip.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-lg font-bold text-green-600 mb-1">
                        ${calculateNetSalary(payslip).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getMonthName(payslip.month)} {payslip.year}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Basic</p>
                        <p className="font-medium">${(payslip.basic_salary || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Allowances</p>
                        <p className="font-medium text-green-600">+${(payslip.allowances || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Deductions</p>
                        <p className="font-medium text-red-600">-${(payslip.deductions || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Net</p>
                        <p className="font-bold">${calculateNetSalary(payslip).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPayslip(payslip)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownloadPayslip(
                          payslip.id,
                          employeeName,
                          payslip.month,
                          payslip.year
                        )}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 mb-4">
                  <FileText size={64} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payslips found</h3>
                <p className="text-gray-600 mb-6">
                  No payslips match your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={handleBulkGenerate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Payslips
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payslip Details Modal */}
        {selectedPayslip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payslip Details</h2>
                    <p className="text-gray-600">
                      {selectedPayslip.profiles?.full_name || selectedPayslip.profiles?.email || 'Unknown'} • {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Employee Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Employee Name</p>
                        <p className="font-medium">{selectedPayslip.profiles?.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employee ID</p>
                        <p className="font-medium">{selectedPayslip.profiles?.employee_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{selectedPayslip.profiles?.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedPayslip.profiles?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Salary Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basic Salary</span>
                        <span className="font-medium">
                          ${(selectedPayslip.basic_salary || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allowances</span>
                        <span className="font-medium text-green-600">
                          +${(selectedPayslip.allowances || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deductions</span>
                        <span className="font-medium text-red-600">
                          -${(selectedPayslip.deductions || 0).toLocaleString()}
                        </span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Salary</span>
                        <span className="text-green-600">
                          ${calculateNetSalary(selectedPayslip).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedPayslip.status)}`}>
                          {(selectedPayslip.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Date</p>
                        <p className="font-medium">
                          {selectedPayslip.payment_date ? 
                            new Date(selectedPayslip.payment_date).toLocaleDateString() : 
                            "Not paid yet"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Generated On</p>
                        <p className="font-medium">
                          {selectedPayslip.created_at ? 
                            new Date(selectedPayslip.created_at).toLocaleDateString() : 
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium">
                          {selectedPayslip.payment_method || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPayslip.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded">
                        {selectedPayslip.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      onClick={() => setSelectedPayslip(null)}
                      className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleDownloadPayslip(
                        selectedPayslip.id,
                        selectedPayslip.profiles?.full_name || selectedPayslip.profiles?.email,
                        selectedPayslip.month,
                        selectedPayslip.year
                      )}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Download PDF
                    </button>
                    {selectedPayslip.status !== "paid" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedPayslip.id, "paid")}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Mark as Paid
                      </button>
                    )}
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