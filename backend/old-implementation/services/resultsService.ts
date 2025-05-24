import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to results directory - try multiple locations
const POSSIBLE_RESULTS_PATHS = [
  path.join(__dirname, "../../../k6-tests/results"), // /k6-tests/results
  "/results", // Docker volume mount point
];

// Find the actual results directory that exists
const findResultsDirectory = async (): Promise<string> => {
  for (const resultsPath of POSSIBLE_RESULTS_PATHS) {
    try {
      await fs.access(resultsPath);
      const stats = await fs.stat(resultsPath);
      if (stats.isDirectory()) {
        return resultsPath;
      }
    } catch (error) {
      // Directory doesn't exist, try next one
      continue;
    }
  }

  // If no existing directory found, create the first one
  const defaultPath = POSSIBLE_RESULTS_PATHS[0];
  try {
    await fs.mkdir(defaultPath, { recursive: true });
    console.log(`Created results directory: ${defaultPath}`);
  } catch (error) {
    console.error(`Failed to create results directory: ${error}`);
  }
  return defaultPath;
};

export interface TestDirectory {
  name: string;
  path: string;
  date: Date;
  type?: "directory" | "virtual"; // Add optional type for clarity
}

export interface TestFile {
  name: string;
  path: string;
}

// Get all result directories
export const getResultDirectories = async (): Promise<TestDirectory[]> => {
  try {
    const resultsDir = await findResultsDirectory();
    console.log(`Using results directory: ${resultsDir}`);

    const entries = await fs.readdir(resultsDir, { withFileTypes: true });
    const directories: TestDirectory[] = [];
    const virtualDirectories: TestDirectory[] = [];

    // Real directories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Extract date from directory name (format: sequential_YYYYMMDD_HHMMSS)
        const match = entry.name.match(/(\d{8}_\d{6})/);
        let date = new Date();

        if (match) {
          const dateStr = match[1];
          const year = parseInt(dateStr.substr(0, 4));
          const month = parseInt(dateStr.substr(4, 2)) - 1; // Month is 0-indexed
          const day = parseInt(dateStr.substr(6, 2));
          const hour = parseInt(dateStr.substr(9, 2));
          const minute = parseInt(dateStr.substr(11, 2));
          const second = parseInt(dateStr.substr(13, 2));

          date = new Date(year, month, day, hour, minute, second);
        }

        directories.push({
          name: entry.name,
          path: path.join(resultsDir, entry.name),
          date: date,
          type: "directory",
        });
      }
    }

    // Virtual directories for single .json files in results dir
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        // Try to extract date from filename: 20250522_165817_account.json
        const match = entry.name.match(/^(\d{8})_(\d{6})_/);
        let date = new Date();
        if (match) {
          const dateStr = match[1];
          const timeStr = match[2];
          const year = parseInt(dateStr.substr(0, 4));
          const month = parseInt(dateStr.substr(4, 2)) - 1;
          const day = parseInt(dateStr.substr(6, 2));
          const hour = parseInt(timeStr.substr(0, 2));
          const minute = parseInt(timeStr.substr(2, 2));
          const second = parseInt(timeStr.substr(4, 2));
          date = new Date(year, month, day, hour, minute, second);
        }
        virtualDirectories.push({
          name: entry.name,
          path: path.join(resultsDir, entry.name),
          date: date,
          type: "virtual",
        });
      }
    }

    // Sort all by date descending
    const allDirs = [...directories, ...virtualDirectories].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    console.log(`Found ${allDirs.length} result directories (real + virtual)`);
    return allDirs;
  } catch (error) {
    console.error("Error getting result directories:", error);
    return [];
  }
};

// Get all result files in a directory
export const getResultFiles = async (
  directory: string
): Promise<TestFile[]> => {
  try {
    const resultsDir = await findResultsDirectory();

    // Check if this is a virtual directory (single file)
    if (directory.endsWith(".json")) {
      // This is a virtual directory for a single file
      // Extract the test name from the filename for display
      const match = directory.match(/^\d{8}_\d{6}_(.+)\.json$/);
      const testName = match ? match[1] : directory.replace(".json", "");

      const filePath = path.join(resultsDir, directory);

      console.log(`Reading single file: ${filePath}`);

      // Check if file exists directly in results directory
      try {
        await fs.access(filePath);
        return [
          {
            name: `${testName}.json`, // Display as simple test name
            path: filePath,
          },
        ];
      } catch (error) {
        console.error(`Single file ${filePath} not found:`, error);
        throw new Error(`File ${directory} not found`);
      }
    } else {
      // This is a real directory (sequential/parallel run)
      const dirPath = path.join(resultsDir, directory);

      console.log(`Reading files from directory: ${dirPath}`);

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => ({
          name: entry.name, // These are already simple names like "account.json"
          path: path.join(dirPath, entry.name),
        }));

      console.log(`Found ${files.length} result files in ${directory}`);
      return files;
    }
  } catch (error) {
    console.error(
      `Error getting result files for directory ${directory}:`,
      error
    );
    throw error;
  }
};

// Get a specific test result file
export const getTestResult = async (
  directory: string,
  file: string
): Promise<any> => {
  try {
    const resultsDir = await findResultsDirectory();
    let filePath: string;

    // Check if this is a virtual directory (single file)
    if (directory.endsWith(".json")) {
      // For virtual directories (individual tests), the file is directly in results directory
      // and the directory name IS the actual file name
      filePath = path.join(resultsDir, directory);
      console.log(`Reading individual test result from: ${filePath}`);
    } else {
      // For real directories (sequential/parallel runs), file is inside the directory
      // Use the file parameter as-is since files in sequential runs are simple names like "account.json"
      filePath = path.join(resultsDir, directory, file);
      console.log(`Reading sequential test result from: ${filePath}`);
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const result = JSON.parse(fileContent);

    console.log(`Successfully loaded test result for ${file || directory}`);
    return result;
  } catch (error) {
    console.error(`Error getting test result for ${file || directory}:`, error);
    throw error;
  }
};
