import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Building,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("attendance");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    totalLeaves: 0,
    totalPayroll: 0,
    avgSalary: 0
  });

  useEffect(() => {
    fetchDepartments();
    fetchSummaryStats();
  }, []);

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange, departmentFilter]);

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .order("name");
    setDepartments(data || []);
  }

  async function fetchSummaryStats() {
    try {
      // Total employees
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: 'exact', head: true });

      // Total leaves in current month
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data: leaves } = await supabase
        .from("leaves")
        .select("*")
        .gte("start_date", currentMonth);

      // Total payroll for current month
      const { data: payrolls } = await supabase
        .from("payrolls")
        .select("net_salary")
        .eq("status", "paid")
        .gte("month", currentMonth);

      // Average salary
      const { data: salaries } = await supabase
        .from("salary_structures")
        .select("base_salary")
        .eq("is_active", true);

      const avgSalary = salaries && salaries.length > 0 
        ? salaries.reduce((sum, s) => sum + s.base_salary, 0) / salaries.length
        : 0;

      setSummaryStats({
        totalEmployees: employeeCount || 0,
        totalLeaves: leaves?.length || 0,
        totalPayroll: payrolls?.reduce((sum, p) => sum + p.net_salary, 0) || 0,
        avgSalary
      });

    } catch (error) {
      console.error("Error fetching summary stats:", error);
    }
  }

  async function generateReport() {
    setLoading(true);
    
    try {
      let data = null;
      
      switch (reportType) {
        case "attendance":
          data = await generateAttendanceReport();
          break;
        case "leaves":
          data = await generateLeaveReport();
          break;
        case "salary":
          data = await generateSalaryReport();
          break;
        case "department":
          data = await generateDepartmentReport();
          break;
        default:
          data = await generateAttendanceReport();
      }
      
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateAttendanceReport() {
    // This would typically query your attendance records
    // For now, returning mock data
    return {
      title: "Attendance Report",
      columns: ["Date", "Present", "Absent", "Late", "Leave"],
      data: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toLocaleDateString(),
          present: Math.floor(Math.random() * 100),
          absent: Math.floor(Math.random() * 10),
          late: Math.floor(Math.random() * 15),
          leave: Math.floor(Math.random() * 20)
        };
      })
    };
  }

  async function generateLeaveReport() {
    const { data } = await supabase
      .from("leaves")
      .select(`
        *,
        employees (
          name,
          departments (name)
        ),
        leave_types (name)
      `)
      .gte("start_date", dateRange.start)
      .lte("end_date", dateRange.end);

    // Group by leave type
    const byType = {};
    data?.forEach(leave => {
      const type = leave.leave_types?.name;
      if (type) {
        if (!byType[type]) byType[type] = { count: 0, days: 0 };
        byType[type].count++;
        byType[type].days += leave.total_days;
      }
    });

    // Group by department
    const byDepartment = {};
    data?.forEach(leave => {
      const dept = leave.employees?.departments?.name || "Unknown";
      if (!byDepartment[dept]) byDepartment[dept] = { count: 0, days: 0 };
      byDepartment[dept].count++;
      byDepartment[dept].days += leave.total_days;
    });

    return {
      title: "Leave Analysis Report",
      summary: {
        totalLeaves: data?.length || 0,
        totalDays: data?.reduce((sum, l) => sum + l.total_days, 0) || 0,
        byType,
        byDepartment
      }
    };
  }

  async function generateSalaryReport() {
    const { data } = await supabase
      .from("payrolls")
      .select(`
        *,
        employees (
          name,
          departments (name)
        )
      `)
      .gte("month", dateRange.start.slice(0, 7) + "-01")
      .lte("month", dateRange.end.slice(0, 7) + "-01");

    // Group by month
    const byMonth = {};
    data?.forEach(payroll => {
      const month = new Date(payroll.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!byMonth[month]) byMonth[month] = { amount: 0, count: 0 };
      byMonth[month].amount += payroll.net_salary;
      byMonth[month].count++;
    });

    // Group by department
    const byDepartment = {};
    data?.forEach(payroll => {
      const dept = payroll.employees?.departments?.name || "Unknown";
      if (!byDepartment[dept]) byDepartment[dept] = { amount: 0, count: 0 };
      byDepartment[dept].amount += payroll.net_salary;
      byDepartment[dept].count++;
    });

    return {
      title: "Salary Expenditure Report",
      summary: {
        totalAmount: data?.reduce((sum, p) => sum + p.net_salary, 0) || 0,
        byMonth,
        byDepartment
      }
    };
  }

  async function generateDepartmentReport() {
    // Get employee count by department
    const { data: employees } = await supabase
      .from("employees")
      .select(`
        id,
        departments (name)
      `);

    const deptCount = {};
    employees?.forEach(emp => {
      const dept = emp.departments?.name || "Unassigned";
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    // Get leave count by department
    const { data: leaves } = await supabase
      .from("leaves")
      .select(`
        total_days,
        employees (
          departments (name)
        )
      `)
      .gte("start_date", dateRange.start)
      .lte("end_date", dateRange.end);

    const deptLeaves = {};
    leaves?.forEach(leave => {
      const dept = leave.employees?.departments?.name || "Unknown";
      deptLeaves[dept] = (deptLeaves[dept] || 0) + leave.total_days;
    });

    return {
      title: "Department Performance Report",
      summary: {
        employeeCount: deptCount,
        leaveDays: deptLeaves
      }
    };
  }

  function exportReport() {
    if (!reportData) return;

    let csvContent = "";
    
    switch (reportType) {
      case "attendance":
        csvContent = exportAttendanceCSV();
        break;
      case "leaves":
        csvContent = exportLeaveCSV();
        break;
      case "salary":
        csvContent = exportSalaryCSV();
        break;
      case "department":
        csvContent = exportDepartmentCSV();
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function exportAttendanceCSV() {
    const headers = ["Date", "Present", "Absent", "Late", "Leave"];
    const rows = reportData.data.map(row => [
      row.date,
      row.present,
      row.absent,
      row.late,
      row.leave
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  function exportLeaveCSV() {
    const headers = ["Leave Type", "Count", "Total Days"];
    const rows = Object.entries(reportData.summary.byType || {}).map(([type, data]) => [
      type,
      data.count,
      data.days
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  function exportSalaryCSV() {
    const headers = ["Month", "Total Amount", "Employee Count"];
    const rows = Object.entries(reportData.summary.byMonth || {}).map(([month, data]) => [
      month,
      data.amount,
      data.count
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  function exportDepartmentCSV() {
    const headers = ["Department", "Employee Count", "Leave Days"];
    const rows = Object.entries(reportData.summary.employeeCount || {}).map(([dept, count]) => [
      dept,
      count,
      reportData.summary.leaveDays[dept] || 0
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">Generate insights from your organization data</p>
        </div>
        <button
          onClick={exportReport}
          disabled={!reportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold mt-2">{summaryStats.totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month's Leaves</p>
              <p className="text-2xl font-bold mt-2">{summaryStats.totalLeaves}</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payroll This Month</p>
              <p className="text-2xl font-bold mt-2">
                ${summaryStats.totalPayroll.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Salary</p>
              <p className="text-2xl font-bold mt-2">
                ${Math.round(summaryStats.avgSalary).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="attendance">Attendance Report</option>
              <option value="leaves">Leave Analysis</option>
              <option value="salary">Salary Expenditure</option>
              <option value="department">Department Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Display */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-6">{reportData?.title}</h2>
        
        {reportType === "attendance" && reportData?.data && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {reportData.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-200">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 font-medium">{row.present}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-medium">{row.absent}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-600 font-medium">{row.late}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-600 font-medium">{row.leave}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === "leaves" && reportData?.summary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium text-gray-700 mb-4">By Leave Type</h3>
              <div className="space-y-4">
                {Object.entries(reportData.summary.byType || {}).map(([type, data]) => (
                  <div key={type} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{type}</span>
                      <span className="text-blue-600">{data.count} requests</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Days</span>
                      <span className="font-medium">{data.days} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-4">By Department</h3>
              <div className="space-y-4">
                {Object.entries(reportData.summary.byDepartment || {}).map(([dept, data]) => (
                  <div key={dept} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{dept}</span>
                      <span className="text-green-600">{data.count} requests</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Days</span>
                      <span className="font-medium">{data.days} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === "salary" && reportData?.summary && (
          <div className="space-y-8">
            <div>
              <h3 className="font-medium text-gray-700 mb-4">Monthly Expenditure</h3>
              <div className="space-y-4">
                {Object.entries(reportData.summary.byMonth || {}).map(([month, data]) => (
                  <div key={month} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{month}</span>
                      <span className="text-xl font-bold text-green-600">
                        ${data.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500">Employees Paid</span>
                      <span className="font-medium">{data.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === "department" && reportData?.summary && (
          <div className="space-y-8">
            <div>
              <h3 className="font-medium text-gray-700 mb-4">Department Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(reportData.summary.employeeCount || {}).map(([dept, count]) => (
                  <div key={dept} className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">{dept}</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{count} employees</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Leave Days:</span>
                        <span className="font-medium">
                          {reportData.summary.leaveDays[dept] || 0} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Avg. Salary:</span>
                        <span className="font-medium">
                          ${Math.floor(Math.random() * 5000 + 3000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}