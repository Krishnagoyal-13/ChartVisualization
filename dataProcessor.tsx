import * as XLSX from "xlsx";

export interface ProcessedData {
  company: string;
  columns: string[];
  ageColumn: string;
  tableData: any[];
  filename: string;
}

export const DataProcessor = {
  findColumnsInExcel(file: File, callback: (result: ProcessedData) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      const data = new Uint8Array(e.target.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
        defval: 0,
      });

      if (jsonData.length === 0) {
        console.warn("Uploaded file is empty or improperly formatted.");
        callback({
          company: "Unknown",
          columns: [],
          ageColumn: "",
          tableData: [],
          filename: "",
        });
        return;
      }

      // Detect company name from filename
      const fileName = file.name.toLowerCase();
      const companyMap: Record<string, string> = {
        canada: "Canada",
        manu: "Manulife",
        sun: "Sun Life",
        equitable: "Equitable Life",
      };

      let company =
        Object.keys(companyMap).find((key) => fileName.includes(key)) ||
        "Unknown";
      company = companyMap[company] || "Unknown";

      // Normalize column headers
      const normalizedKeys = Object.keys(jsonData[0]).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = key;
        return acc;
      }, {} as Record<string, string>);

      // Define standardized column names
      const standardizedColumnNames: Record<string, string> = {
        age: "Age",
        premium: "Premium",
        gcv: "Guaranteed Cash Value",
        tcv: "Total Cash Value",
        tdb: "Total Death Benefit",
        dollarValue: "Dollar Value",
      };

      // Define column mappings
      const columnMap: Record<string, string[]> = {
        age: ["age", "attained age", "policy year"],
        premium: [
          "annualized scheduled premium",
          "premium",
          "deposit",
          "yearly premium",
        ],
        gcv: ["guaranteed cash value", "cash value"],
        tcv: ["total cash value", "cash surrender value"],
        tdb: [
          "total death benefit",
          "primary insured person's death benefit",
          "total payout on death",
        ],
      };

      const findColumn = (possibleNames: string[]) =>
        Object.keys(normalizedKeys).find((key) =>
          possibleNames.some((name) => key.includes(name.toLowerCase()))
        ) || "";

      // Detect and standardize columns using the column map
      let ageCol = findColumn(columnMap["age"]) || "age";
      let premiumCol = findColumn(columnMap["premium"]) || "premium";
      let gcvCol = findColumn(columnMap["gcv"]) || "gcv";
      let tcvCol = findColumn(columnMap["tcv"]) || "tcv";
      let tdbCol = findColumn(columnMap["tdb"]) || "tdb";

      // Standardize data storage with uniform column names and calculate Dollar Value
      let accumulatedPremium = 0;
      const tableData = jsonData.map((row) => {
        accumulatedPremium += row[normalizedKeys[premiumCol]] || 0;
        let formattedRow: Record<string, any> = {
          Age: row[normalizedKeys[ageCol]] || 0,
          Premium: row[normalizedKeys[premiumCol]] || 0,
          "Guaranteed Cash Value": row[normalizedKeys[gcvCol]] || 0,
          "Total Cash Value": row[normalizedKeys[tcvCol]] || 0,
          "Total Death Benefit": row[normalizedKeys[tdbCol]] || 0,
          "Dollar Value":
            accumulatedPremium > 0
              ? (row[normalizedKeys[tcvCol]] || 0) / accumulatedPremium
              : 0,
        };
        return formattedRow;
      });

      callback({
        company,
        columns: Object.values(standardizedColumnNames),
        ageColumn: "Age",
        tableData,
        filename: fileName,
      });
    };
    reader.readAsArrayBuffer(file);
  },
};
