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

      // Read first few rows to detect headers dynamically
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      // Identify the header row by searching for "age" or "year" in the first column
      let headerRowIndex = rawData.findIndex(
        (row) => row[0] && /age|year/i.test(row[0].toString())
      );

      if (headerRowIndex === -1 || headerRowIndex + 1 >= rawData.length) {
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

      console.log("Detected header row index:", headerRowIndex);
      const headers = rawData[headerRowIndex].map((cell: any) =>
        cell ? cell.toString().trim().toLowerCase().replace(/\s+/g, " ") : ""
      );
      console.log("Detected Headers:", headers);

      // Extract data from rows below the detected header row
      const jsonData = rawData.slice(headerRowIndex + 1).map((row) => {
        let formattedRow: Record<string, any> = {};
        headers.forEach((header, index) => {
          formattedRow[header] = row[index] !== undefined ? row[index] : 0;
        });
        return formattedRow;
      });

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
          "payments",
          "total yearly premium",
        ],
        gcv: ["guaranteed cash value"],
        tcv: [
          "total cash value",
          "account value",
          "cash surrender value",
          "fund value (primary rate)",
        ],
        tdb: [
          "total death benefit",
          "total term",
          "primary insured person's death benefit",
          "total payout on death",
          "total policy death benefit",
          "total policy death benefit (primary rate)",
          "critical illness insurance benefit",
        ],
      };

      const findColumn = (possibleNames: string[]): string =>
        headers.find((header: string) =>
          possibleNames.some((name) => header.includes(name.toLowerCase()))
        ) || "";

      // Detect and standardize columns using the column map
      let ageCol = findColumn(columnMap["age"]) || "age";
      let premiumCol = findColumn(columnMap["premium"]) || "premium";
      let gcvCol = findColumn(columnMap["gcv"]) || "gcv";
      let tcvCol = findColumn(columnMap["tcv"]) || "tcv";
      let tdbCol = findColumn(columnMap["tdb"]) || "tdb";

      console.log("Detected Columns:", {
        ageCol,
        premiumCol,
        gcvCol,
        tcvCol,
        tdbCol,
      });

      // Standardize data storage with uniform column names and calculate Dollar Value
      let accumulatedPremium = 0;
      const tableData = jsonData.map((row: any) => {
        accumulatedPremium += row[premiumCol] || 0;
        return {
          Age: row[ageCol] || 0,
          Premium: row[premiumCol] || 0,
          "Guaranteed Cash Value": row[gcvCol] || 0,
          "Total Cash Value": row[tcvCol] || 0,
          "Total Death Benefit": row[tdbCol] || 0,
          "Dollar Value":
            accumulatedPremium > 0
              ? (row[tcvCol] || 0) / accumulatedPremium
              : 0,
        };
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
