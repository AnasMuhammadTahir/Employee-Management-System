import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { 
  Calendar, Filter, Download, Search, 
  CheckCircle, XCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp
} from "lucide-react";

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    employee: '',
    leaveType: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeaves, setSelectedLeaves] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, filters, searchTerm]);

  async function fetchLeaves() {
    try {
      const { data } = await supabase
        .from("leaves")
        .select(`
          id,
          start_date,
          end_date,
          reason,
          status,
          total_days,
          created_at,
          employees (
            id,
            name,
            email,
            departments (name)
          ),
          leave_types (name, is_paid),
          approved_by,
          approved_at,
          rejection_reason
        `)
        .order("created_at", { ascending: false });

      setLeaves(data || []);
      setFilteredLeaves(data || []);
      
      // Calculate stats
      if (data) {
        const stats = {
          total: data.length,
          pending: data.filter(l => l.status === 'pending').length,
          approved: data.filter(l => l.status === 'approved').length,
          rejected: data.filter(l => l.status === 'rejected').length
        };
        setStats(stats);
      }
      
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterLeaves() {
    let filtered = [...leaves];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(leave => leave.status === filters.status);
    }

    // Apply leave type filter
    if (filters.leaveType !== 'all') {
      filtered = filtered.filter(leave => leave.leave_types?.name === filters.leaveType);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(leave => new Date(leave.start_date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(leave => new Date(leave.end_date) <= new Date(filters.dateTo));
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(leave => 
        leave.employees?.name.toLowerCase().includes(term) ||
        leave.reason?.toLowerCase().includes(term) ||
        leave.employees?.email.toLowerCase().includes(term)
      );
    }

    setFilteredLeaves(filtered);
  }

  async function updateStatus(id, status, rejectionReason = '') {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updates.approved_at = new Date().toISOString();
      // In production, get current user ID from auth
      updates.approved_by = 'admin-user-id';
    } else if (status === 'rejected') {
      updates.rejection_reason = rejectionReason || 'Rejected by administrator';
    }

    const { error } = await supabase
      .from("leaves")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert('Error updating leave status: ' + error.message);
      return;
    }

    // Update leave balances if approved
    if (status === 'approved') {
      await updateLeaveBalances(id);
    }

    fetchLeaves();
  }

  async function updateLeaveBalances(leaveId) {
    const { data: leave } = await supabase
      .from("leaves")
      .select(`
        employee_id,
        leave_type_id,
        total_days
      `)
      .eq("id", leaveId)
      .single();

    if (!leave) return;

    const currentYear = new Date().getFullYear();
    
    // Update leave balance
    const { data: balance } = await supabase
      .from("leave_balances")
      .select("id, used")
      .eq("employee_id", leave.employee_id)
      .eq("leave_type_id", leave.leave_type_id)
      .eq("year", currentYear)
      .single();

    if (balance) {
      await supabase
        .from("leave_balances")
        .update({ used: balance.used + leave.total_days })
        .eq("id", balance.id);
    }
  }

  async function bulkUpdateStatus(status) {
    if (!selectedLeaves.length) {
      alert('Please select leaves to update');
      return;
    }

    const confirmMessage = status === 'approved' 
      ? `Approve ${selectedLeaves.length} selected leave(s)?`
      : `Reject ${selectedLeaves.length} selected leave(s)?`;

    if (!window.confirm(confirmMessage)) return;

    const updates = selectedLeaves.map(id => ({
      id,
      status,
      [status === 'approved' ? 'approved_at' : 'rejected_at']: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("leaves")
        .update(update)
        .eq("id", update.id);

      if (error) {
        console.error('Error updating leave:', error);
      }
    }

    setSelectedLeaves([]);
    fetchLeaves();
  }

  function exportToCSV() {
    const headers = ['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
    const csvData = filteredLeaves.map(leave => [
      leave.employees?.name,
      leave.employees?.departments?.name,
      leave.leave_types?.name,
      leave.start_date,
      leave.end_date,
      leave.total_days,
      leave.status,
      leave.reason || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaves-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-2">Review and manage employee leave requests</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Leaves"
          value={stats.total}
          icon={<Calendar className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          {selectedLeaves.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedLeaves.length} selected
              </span>
              <button
                onClick={() => bulkUpdateStatus('approved')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Approve Selected
              </button>
              <button
                onClick={() => bulkUpdateStatus('rejected')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Reject Selected
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by employee name or reason..."
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-4 py-2"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />
          
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-4 py-2"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeaves.length === filteredLeaves.length && filteredLeaves.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeaves(filteredLeaves.map(l => l.id));
                      } else {
                        setSelectedLeaves([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Leave Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dates</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No leave requests found</p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <>
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeaves.includes(leave.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeaves([...selectedLeaves, leave.id]);
                            } else {
                              setSelectedLeaves(selectedLeaves.filter(id => id !== leave.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{leave.employees?.name}</p>
                          <p className="text-sm text-gray-500">{leave.employees?.email}</p>
                          <p className="text-xs text-gray-400">{leave.employees?.departments?.name}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <p>{leave.leave_types?.name}</p>
                          <p className="text-xs text-gray-500">
                            {leave.leave_types?.is_paid ? 'Paid Leave' : 'Unpaid Leave'}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <p>{new Date(leave.start_date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">to</p>
                          <p>{new Date(leave.end_date).toLocaleDateString()}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          leave.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                        {leave.status !== 'pending' && (
                          <p className="text-xs text-gray-500 mt-1">
                            {leave.approved_at && new Date(leave.approved_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {leave.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => updateStatus(leave.id, 'approved')}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (optional):');
                                  if (reason !== null) {
                                    updateStatus(leave.id, 'rejected', reason);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => updateStatus(leave.id, 'pending')}
                              className="text-gray-600 hover:text-gray-800"
                              title="Reset to Pending"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedRow(expandedRow === leave.id ? null : leave.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRow === leave.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRow === leave.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Leave Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Applied On:</span>
                                  <span>{new Date(leave.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Total Days:</span>
                                  <span>{leave.total_days} working days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Leave Type:</span>
                                  <span>{leave.leave_types?.name}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Reason</h4>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                {leave.reason || 'No reason provided'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Actions History</h4>
                              <div className="space-y-2 text-sm">
                                {leave.approved_by && (
                                  <p className="text-gray-600">
                                    Approved by: <span className="font-medium">Administrator</span>
                                  </p>
                                )}
                                {leave.approved_at && (
                                  <p className="text-gray-600">
                                    Approved on: {new Date(leave.approved_at).toLocaleDateString()}
                                  </p>
                                )}
                                {leave.rejection_reason && (
                                  <>
                                    <p className="font-medium text-red-600">Rejection Reason:</p>
                                    <p className="text-gray-600">{leave.rejection_reason}</p>
                                  </>
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
        
        {/* Pagination */}
        {filteredLeaves.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredLeaves.length}</span> of{' '}
              <span className="font-medium">{leaves.length}</span> leaves
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>
              <span className="px-3 py-1 text-sm">1</span>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}