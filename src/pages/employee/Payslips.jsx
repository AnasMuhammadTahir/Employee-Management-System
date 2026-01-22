import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchPayslips();
  }, [yearFilter, monthFilter]);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUser(profile);
    }
  };

  const fetchPayslips = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("year", yearFilter)
        .eq("month", monthFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPayslips(data || []);
    } catch (error) {
      console.error("Error fetching payslips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (payslipId, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from("payslips")
        .download(`${payslipId}.pdf`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading payslip:", error);
      alert("Failed to download payslip");
    }
  };

  const handleViewDetails = (payslip) => {
    setSelectedPayslip(payslip);
  };

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const calculateNetSalary = (payslip) => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-2">View and download your salary slips</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-600 mt-1">
                  Employee ID: {user.employee_id || "N/A"} | Department: {user.department || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">Current Salary</p>
                <p className="text-2xl font-bold text-green-600">
                  ${user.salary?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Payslips</h3>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              >
                {[2022, 2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payslips List */}
        <div className="space-y-4">
          {payslips.length > 0 ? (
            payslips.map(payslip => (
              <div key={payslip.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getMonthName(payslip.month)} {payslip.year}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Generated on: {new Date(payslip.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Status: <span className={`font-medium ${payslip.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {payslip.status?.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Net Salary</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${calculateNetSalary(payslip).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(payslip)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownload(payslip.id, `payslip-${payslip.month}-${payslip.year}.pdf`)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payslips found</h3>
              <p className="text-gray-600">
                No payslips available for {getMonthName(monthFilter)} {yearFilter}
              </p>
            </div>
          )}
        </div>

        {/* Payslip Details Modal */}
        {selectedPayslip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Payslip Details
                    </h2>
                    <p className="text-gray-600">
                      {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
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
                  {/* Salary Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Salary Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basic Salary</span>
                        <span className="font-medium">
                          ${selectedPayslip.basic_salary?.toLocaleString() || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allowances</span>
                        <span className="font-medium text-green-600">
                          +${selectedPayslip.allowances?.toLocaleString() || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deductions</span>
                        <span className="font-medium text-red-600">
                          -${selectedPayslip.deductions?.toLocaleString() || "0.00"}
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

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Payment Date</p>
                        <p className="font-medium">
                          {selectedPayslip.payment_date ? 
                            new Date(selectedPayslip.payment_date).toLocaleDateString() : 
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium">
                          {selectedPayslip.payment_method || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Days Worked</p>
                        <p className="font-medium">
                          {selectedPayslip.days_worked || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Overtime Hours</p>
                        <p className="font-medium">
                          {selectedPayslip.overtime_hours || "0"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPayslip.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Notes
                      </h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded">
                        {selectedPayslip.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setSelectedPayslip(null)}
                      className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleDownload(selectedPayslip.id, `payslip-details-${selectedPayslip.month}-${selectedPayslip.year}.pdf`)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Download PDF
                    </button>
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