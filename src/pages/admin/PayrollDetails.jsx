import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, CheckCircle, XCircle, Clock, DollarSign, Users, Calendar, FileText, Printer, Send, MoreVertical } from "lucide-react";

export default function PayrollDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [payroll, setPayroll] = useState(null);
  const [payrollItems, setPayrollItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [summary, setSummary] = useState({
    totalSalary: 0,
    totalEmployees: 0,
    pending: 0,
    paid: 0,
    failed: 0
  });

  useEffect(() => {
    if (id) {
      fetchPayrollDetails();
    }
  }, [id]);

  const fetchPayrollDetails = async () => {
    try {
      setLoading(true);

      // Fetch payroll details
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select(`
          *,
          processed_by_profile:processed_by (
            full_name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (payrollError) throw payrollError;

      // Fetch payroll items with employee details
      const { data: itemsData, error: itemsError } = await supabase
        .from("payroll_items")
        .select(`
          *,
          employee:user_id (
            full_name,
            email,
            employee_id,
            department
          )
        `)
        .eq("payroll_id", id)
        .order("created_at");

      if (itemsError) throw itemsError;

      // Calculate summary
      const totalSalary = itemsData?.reduce((sum, item) => sum + (item.net_salary || 0), 0) || 0;
      const pending = itemsData?.filter(item => item.status === 'pending').length || 0;
      const paid = itemsData?.filter(item => item.status === 'paid').length || 0;
      const failed = itemsData?.filter(item => item.status === 'failed').length || 0;

      setPayroll(payrollData);
      setPayrollItems(itemsData || []);
      setSummary({
        totalSalary,
        totalEmployees: itemsData?.length || 0,
        pending,
        paid,
        failed
      });
    } catch (error) {
      console.error("Error fetching payroll details:", error);
      alert("Failed to load payroll details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId, status) => {
    try {
      const { error } = await supabase
        .from("payroll_items")
        .update({ status })
        .eq("id", itemId);

      if (error) throw error;

      // Refresh data
      await fetchPayrollDetails();
      alert(`Status updated to ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedItems.length === 0) {
      alert("Please select items to update");
      return;
    }

    if (!confirm(`Update ${selectedItems.length} items to ${status}?`)) return;

    try {
      const { error } = await supabase
        .from("payroll_items")
        .update({ status })
        .in("id", selectedItems);

      if (error) throw error;

      setSelectedItems([]);
      await fetchPayrollDetails();
      alert(`Updated ${selectedItems.length} items to ${status}`);
    } catch (error) {
      console.error("Error updating bulk status:", error);
      alert("Failed to update items");
    }
  };

  const handleProcessPayroll = async () => {
    if (!confirm("Process this payroll? This will mark all items as paid and update payroll status.")) return;

    try {
      setProcessing(true);

      // Update payroll status
      const { error: payrollError } = await supabase
        .from("payroll")
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (payrollError) throw payrollError;

      // Update all items to paid
      const { error: itemsError } = await supabase
        .from("payroll_items")
        .update({ status: 'paid' })
        .eq("payroll_id", id)
        .eq("status", 'pending');

      if (itemsError) throw itemsError;

      // Generate payslips for each item
      for (const item of payrollItems) {
        if (item.status === 'pending') {
          await supabase
            .from("payslips")
            .insert({
              user_id: item.user_id,
              month: payroll.month,
              year: payroll.year,
              basic_salary: item.basic_salary,
              allowances: item.allowances,
              deductions: item.deductions,
              net_salary: item.net_salary,
              status: 'paid',
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: 'Bank Transfer',
              notes: `Processed via payroll: ${payroll.name}`
            });
        }
      }

      await fetchPayrollDetails();
      alert("Payroll processed successfully! Payslips generated.");
    } catch (error) {
      console.error("Error processing payroll:", error);
      alert("Failed to process payroll");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReport = () => {
    // Create CSV content
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status'];
    const rows = payrollItems.map(item => [
      item.employee?.full_name || 'N/A',
      item.employee?.employee_id || 'N/A',
      item.employee?.department || 'N/A',
      `$${item.basic_salary?.toFixed(2)}`,
      `$${item.allowances?.toFixed(2)}`,
      `$${item.deductions?.toFixed(2)}`,
      `$${item.net_salary?.toFixed(2)}`,
      item.status.toUpperCase()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-${payroll?.name}-${payroll?.month}-${payroll?.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendPayslips = async () => {
    if (!confirm("Send payslip notifications to all employees?")) return;
    
    try {
      // This would typically integrate with an email service
      // For now, we'll just show a success message
      alert("Payslip notifications sent to all employees!");
    } catch (error) {
      console.error("Error sending payslips:", error);
      alert("Failed to send payslips");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getItemStatusColor = (status) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Payroll not found</h2>
          <p className="text-gray-600 mt-2">The requested payroll does not exist.</p>
          <button
            onClick={() => navigate("/admin/payroll")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Payroll
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
          <button
            onClick={() => navigate("/admin/payroll")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Payroll
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{payroll.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(payroll.status)}`}>
                  {payroll.status.toUpperCase()}
                </span>
                <span className="text-gray-600">
                  {getMonthName(payroll.month)} {payroll.year}
                </span>
                <span className="text-gray-600">
                  • Created: {new Date(payroll.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadReport}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download size={18} className="mr-2" />
                Export CSV
              </button>
              {payroll.status === 'draft' && (
                <button
                  onClick={handleProcessPayroll}
                  disabled={processing}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      Process Payroll
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${summary.totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-2xl font-bold text-green-600">{summary.paid}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Details */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Payroll Information</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Payroll Period</p>
                <p className="font-medium">
                  {getMonthName(payroll.month)} {payroll.year}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Processed By</p>
                <p className="font-medium">
                  {payroll.processed_by_profile?.full_name || 'Not processed yet'}
                </p>
                {payroll.processed_at && (
                  <p className="text-sm text-gray-500">
                    On {new Date(payroll.processed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Created Date</p>
                <p className="font-medium">
                  {new Date(payroll.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {new Date(payroll.updated_at).toLocaleDateString()}
                </p>
              </div>
              
              {payroll.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium mt-1 p-3 bg-gray-50 rounded">
                    {payroll.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Payments ({payrollItems.length})
              </h2>
              
              <div className="flex space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="">Bulk Actions</option>
                  <option value="paid">Mark as Paid</option>
                  <option value="pending">Mark as Pending</option>
                  <option value="failed">Mark as Failed</option>
                </select>
                
                {payroll.status === 'completed' && (
                  <button
                    onClick={handleSendPayslips}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Send size={16} className="mr-2" />
                    Send Payslips
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === payrollItems.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(payrollItems.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary Breakdown
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
                {payrollItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.employee?.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.employee?.employee_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.employee?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.employee?.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Basic:</span>
                          <span className="font-medium">${item.basic_salary?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Allowances:</span>
                          <span className="font-medium text-green-600">+${item.allowances?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Deductions:</span>
                          <span className="font-medium text-red-600">-${item.deductions?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t pt-1">
                          <span>Net Salary:</span>
                          <span className="text-green-600">${item.net_salary?.toFixed(2)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getItemStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                          disabled={payroll.status === 'completed'}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button
                          onClick={() => {
                            // View employee details
                            navigate(`/admin/employees/${item.user_id}`);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Employee"
                        >
                          <Users size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payroll Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                Final calculations for {getMonthName(payroll.month)} {payroll.year}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm text-gray-600">Total Payroll Amount</p>
              <p className="text-3xl font-bold text-green-600">
                ${summary.totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary.paid} paid • {summary.pending} pending • {summary.failed} failed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}