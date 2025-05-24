import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to tests directory
const TESTS_DIR = path.join(__dirname, "../../../k6-tests/tests");

export interface TestConfig {
  name: string;
  description: string;
  file: string;
}

// Get all available tests
export const getAvailableTests = async (): Promise<TestConfig[]> => {
  try {
    // Create tests directory if it doesn't exist
    try {
      await fs.access(TESTS_DIR);
    } catch {
      await fs.mkdir(TESTS_DIR, { recursive: true });
      return [];
    }

    const entries = await fs.readdir(TESTS_DIR, { withFileTypes: true });
    const tests = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => {
        const name = entry.name.replace(".js", "");
        const formattedName = name
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return {
          name,
          description: formattedName,
          file: path.join(TESTS_DIR, entry.name),
        };
      });

    return tests;
  } catch (error) {
    console.error("Error getting available tests:", error);
    throw error;
  }
};
