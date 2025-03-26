import React from "react";

interface SummaryProps {
  policies: any[];
}

const Summary: React.FC<SummaryProps> = ({ policies }) => {
  if (policies.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No data available for summary.
      </p>
    );
  }

  const totalFiles = policies.length;
  const companies = [...new Set(policies.map((policy) => policy.company))].join(
    ", "
  );
  const intervals = [10, 20, 30, 40, 50];

  const policyData = policies.map((policy) => {
    const tcvKey =
      Object.keys(policy.tableData?.[0] || {}).find((k) =>
        k.toLowerCase().includes("total cash value")
      ) || "";
    const premiumKey = "Premium";
    const totalPremium = policy.tableData.reduce(
      (sum: number, row: Record<string, any>) => sum + (row[premiumKey] || 0),
      0
    );

    return {
      company: policy.company,
      totalPremium,
      data: intervals.map((interval) => {
        const tcvValue = policy.tableData[interval - 1]?.[tcvKey] || 0;
        return {
          year: interval,
          tcv: tcvValue,
        };
      }),
    };
  });

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Summary</h2>
      <p className="text-gray-700">
        A total of <span className="font-bold">{totalFiles}</span> file(s) from
        companies: <span className="font-bold">{companies}</span> have been
        analyzed.
      </p>

      {/* Total Premium Paid & TCV Over Time Table */}
      <h3 className="text-lg font-semibold mt-6 mb-2 text-center">
        Total Premium Paid & TCV Over Time
      </h3>
      <table className="w-full border-collapse border border-gray-300 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              Company
            </th>
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              Total Premium Paid
            </th>
            {intervals.map((year) => (
              <th
                key={year}
                className="border border-gray-300 p-3 text-gray-700 font-medium"
              >
                TCV at Policy Year {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {policyData.map((policy, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="border border-gray-300 p-3 text-gray-700">
                {policy.company}
              </td>
              <td className="border border-gray-300 p-3 text-gray-700 text-center">
                ${policy.totalPremium.toFixed(2)}
              </td>
              {policy.data.map((entry, idx) => (
                <td
                  key={idx}
                  className="border border-gray-300 p-3 text-gray-700 text-center"
                >
                  ${entry.tcv.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Policy Feature Table */}
      <h3 className="text-lg font-semibold mt-6 mb-2 text-center">
        Policy Feature Comparison
      </h3>
      <table className="w-full border-collapse border border-gray-300 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              Company
            </th>
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              Premium
            </th>
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              GCV
            </th>
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              TCV
            </th>
            <th className="border border-gray-300 p-3 text-gray-700 font-medium">
              TDB
            </th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="border border-gray-300 p-3 text-gray-700">
                {policy.company}
              </td>
              <td className="border border-gray-300 p-3 text-gray-700 text-center">
                {policy.tableData.some((row: any) => row.Premium) ? "✔" : "✘"}
              </td>
              <td className="border border-gray-300 p-3 text-gray-700 text-center">
                {policy.tableData.some(
                  (row: any) => row["Guaranteed Cash Value"]
                )
                  ? "✔"
                  : "✘"}
              </td>
              <td className="border border-gray-300 p-3 text-gray-700 text-center">
                {policy.tableData.some((row: any) => row["Total Cash Value"])
                  ? "✔"
                  : "✘"}
              </td>
              <td className="border border-gray-300 p-3 text-gray-700 text-center">
                {policy.tableData.some((row: any) => row["Total Death Benefit"])
                  ? "✔"
                  : "✘"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Summary;
