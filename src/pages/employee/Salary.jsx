import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function Salary() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function fetchSalary() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;

      const { data } = await supabase
        .from("salaries")
        .select("*")
        .eq("employee_id", employee.id)
        .order("pay_date", { ascending: false });

      setRows(data || []);
    }

    fetchSalary();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center mt-4 mb-6">
        Salary Details
      </h1>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th>S No.</Th>
              <Th>Emp ID</Th>
              <Th>Salary</Th>
              <Th>Allowance</Th>
              <Th>Deduction</Th>
              <Th>Total</Th>
              <Th>Pay Date</Th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 border-b"
                >
                  No salary records found
                </td>
              </tr>
            )}

            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <Td>{index + 1}</Td>
                <Td>{row.employee_id}</Td>
                <Td>{row.salary}</Td>
                <Td>{row.allowance}</Td>
                <Td>{row.deduction}</Td>
                <Td className="font-semibold">{row.total}</Td>
                <Td>
                  {new Date(row.pay_date).toLocaleDateString()}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Table helpers ---------- */
function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>;
}
