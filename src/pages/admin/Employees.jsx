import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { 
  Search, UserPlus, Edit2, Trash2, Eye, Mail, Phone, 
  Building, Calendar, Filter, Users, DollarSign, Briefcase,
  AlertCircle, Download
} from "lucide-react";

export default function Employees() {
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch employees WITHOUT joins first (simpler)
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (employeesError) {
        console.error("Employees fetch error:", employeesError);
        throw employeesError;
      }
      
      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");
      
      if (departmentsError) {
        console.error("Departments fetch error:", departmentsError);
      }

      // Transform employees with department names
      const transformedEmployees = (employeesData || []).map(emp => {
        const department = departmentsData?.find(d => d.id === emp.department_id);
        
        return {
          ...emp,
          full_name: emp.name,
          employee_id: emp.employee_code || `EMP${emp.id?.substring(0, 8)?.toUpperCase() || '000'}`,
          active_salary: emp.base_salary || 0,
          departments: department ? { id: department.id, name: department.name } : null
        };
      });
      
      setEmployees(transformedEmployees);
      setDepartments(departmentsData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load employees. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id, email) => {
    if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
    
    try {
      setError("");
      
      const { error: updateError } = await supabase
        .from("employees")
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateError) throw updateError;

      alert("Employee deactivated successfully!");
      fetchData();

    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee. Please try again.");
    }
  };

  const exportEmployees = () => {
    try {
      if (employees.length === 0) {
        alert("No employees to export!");
        return;
      }

      const csvData = employees.map(emp => ({
        'Employee ID': emp.employee_code || 'N/A',
        'Name': emp.name || 'N/A',
        'Email': emp.email || 'N/A',
        'Phone': emp.phone || 'N/A',
        'Department': emp.departments?.name || 'N/A',
        'Position': emp.position || 'N/A',
        'Status': emp.status || 'active',
        'Salary': emp.base_salary || 0
      }));

      const csvHeaders = Object.keys(csvData[0]).join(',');
      const csvRows = csvData.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      );
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Employees exported successfully!");
    } catch (error) {
      console.error("Error exporting employees:", error);
      setError("Failed to export employees.");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      (emp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (emp.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (emp.employee_code?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (emp.phone?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesDepartment = !departmentFilter || emp.department_id === departmentFilter;
    const matchesStatus = !statusFilter || emp.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employee Management</h1>
              </div>
              <p className="text-gray-600">
                {employees.length} employee{employees.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportEmployees}
                className="flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={employees.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export ({employees.length})
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter(e => e.status === 'active').length}
                </p>
              </div>
              <Users className="w-10 h-10 text-green-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
              <Building className="w-10 h-10 text-purple-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Salary</p>
                <p className="text-2xl font-bold text-green-600">
                  ${employees.length > 0 ? 
                    Math.round(employees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0) / employees.length).toLocaleString() 
                    : '0'}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-100" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Employees</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Employees
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or ID..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department & Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employee_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{employee.email}</div>
                        <div className="text-sm text-gray-500">{employee.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4 text-gray-400" />
                            {employee.departments?.name || 'No department'}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            {employee.position || 'No position'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600">
                          ${(employee.base_salary || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.hire_date ? `Since ${formatDate(employee.hire_date)}` : 'No hire date'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(employee.status)}`}>
                          {employee.status?.replace('_', ' ') || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/employees/${employee.id}`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/employees/${employee.id}/edit`)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/employees/${employee.id}/salary`)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="Manage Salary"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEmployee(employee.id, employee.email)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {employees.length === 0 ? "No employees found in database" : "No employees match your filters"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {employees.length === 0 
                          ? "There are no employees in the database yet."
                          : "Try adjusting your search filters to find employees."}
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={fetchData}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Refresh Data
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredEmployees.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{filteredEmployees.length}</span> of{' '}
                  <span className="font-medium">{employees.length}</span> employees
                </div>
                <div className="mt-2 sm:mt-0">
                  <button
                    onClick={exportEmployees}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}