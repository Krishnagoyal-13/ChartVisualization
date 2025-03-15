"use client";
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataProcessor, ProcessedData } from "@/components/dataProcessor";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function CsvVisualizationTool() {
  const [policies, setPolicies] = useState<ProcessedData[]>([]);
  const [chartData, setChartData] = useState<{ [key: string]: any }>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      DataProcessor.findColumnsInExcel(file, (result) => {
        console.log("Processed File:", file.name);
        setPolicies((prevPolicies) => [
          ...prevPolicies,
          { ...result, fileName: file.name },
        ]);
      });
    });
  };

  useEffect(() => {
    if (policies.length > 0) {
      generateChartData(policies);
    }
  }, [policies]);

  const removeFile = (index: number) => {
    setPolicies((prevPolicies) => prevPolicies.filter((_, i) => i !== index));
  };

  const generateChartData = (policies: ProcessedData[]) => {
    if (policies.length === 0) return;

    const labels = policies[0].tableData.map(
      (entry) => entry[policies[0].ageColumn] || "N/A"
    );
    const dataKeys = policies[0].columns.slice(1);
    let newChartData: { [key: string]: any } = {};

    dataKeys.forEach((key) => {
      newChartData[key] = {
        labels,
        datasets: policies.map((policy, index) => ({
          label: `${policy.company} - ${key.toUpperCase()}`,
          data: policy.tableData.map((entry) => parseFloat(entry[key]) || 0),
          borderColor: `hsl(${index * 60}, 70%, 50%)`,
          backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.3)`,
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.4,
        })),
      };
    });

    setChartData(newChartData);
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-blue-700 shadow-md p-4 rounded-lg">
        Visualization Tool
      </h1>

      <div className="flex justify-center">
        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          onChange={handleFileUpload}
          className="border p-3 rounded-lg shadow-md bg-white"
        />
      </div>

      <Card className="p-6 shadow-md rounded-lg bg-white">
        <CardContent>
          {policies.map((policy, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 border rounded-lg shadow-sm bg-gray-100 mb-2"
            >
              <span className="font-semibold text-gray-700">
                {policy.filename} ({policy.company})
              </span>
              <Button variant="destructive" onClick={() => removeFile(index)}>
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Display Graphs in a Single Column Layout for Scrolling */}
      {Object.keys(chartData).map((key) => (
        <Card key={key} className="p-6 shadow-lg rounded-xl bg-white">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
              {key} Visualization
            </h2>
            {chartData[key] && (
              <Line
                data={chartData[key]}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                  scales: {
                    x: { title: { display: true, text: "Age" } },
                    y: { title: { display: true, text: "Value ($)" } },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      ))}

      {policies.length > 0 &&
        policies.map((policy, index) => (
          <Card key={index} className="p-6 shadow-md rounded-lg bg-white">
            <CardContent>
              <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
                Extracted Data - {policy.company}
              </h2>
              <table className="w-full border-collapse border border-gray-300 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-200">
                    {policy.columns.map((key) => (
                      <th
                        key={key}
                        className="border border-gray-300 p-3 text-gray-700 font-medium"
                      >
                        {key.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {policy.tableData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-100">
                      {policy.columns.map((key, colIndex) => (
                        <td
                          key={colIndex}
                          className="border border-gray-300 p-3 text-gray-700"
                        >
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
