import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { getIO } from "../websocket/socket.js";

// Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to k6 tests directory
const K6_TESTS_DIR = path.join(__dirname, "../../../k6-tests");

// Store running processes
const runningProcesses = new Map<string, ChildProcess>();

// Function to generate timestamp in Polish timezone
function generateTimestamp(): string {
  const now = new Date();

  // Convert to Polish timezone (Europe/Warsaw)
  const polandTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" })
  );

  const year = polandTime.getFullYear();
  const month = String(polandTime.getMonth() + 1).padStart(2, "0");
  const day = String(polandTime.getDate()).padStart(2, "0");
  const hours = String(polandTime.getHours()).padStart(2, "0");
  const minutes = String(polandTime.getMinutes()).padStart(2, "0");
  const seconds = String(polandTime.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Function to generate human-readable Polish timestamp
function generateReadableTimestamp(): string {
  const now = new Date();
  return now.toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Helper to detect and clean k6 progress lines
function processK6Output(data: string): string[] {
  const lines = data.toString().split("\n");
  const processedLines: string[] = [];

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Clean ANSI escape codes but preserve content
    const cleanLine = line.replace(/\x1b\[[0-9;]*[mGKH]/g, "");

    // For progress lines, ensure they are properly formatted
    if (
      cleanLine.includes("default [") &&
      cleanLine.includes("%") &&
      cleanLine.includes("VUs")
    ) {
      // This is a k6 progress line - send as is for processing on frontend
      processedLines.push(cleanLine.trim());
    } else if (cleanLine.trim()) {
      // Regular line
      processedLines.push(cleanLine.trim());
    }
  }

  return processedLines;
}

// Stop a running test
export const stopTest = async (testId: string): Promise<boolean> => {
  try {
    const process = runningProcesses.get(testId);
    if (!process) {
      console.log(`No running process found for testId: ${testId}`);
      return false;
    }

    const io = getIO();

    // Send termination signal
    console.log(
      `Stopping test process for testId: ${testId}, PID: ${process.pid}`
    );

    // Try graceful termination first
    process.kill("SIGTERM");

    // Wait a bit, then force kill if needed
    setTimeout(() => {
      if (!process.killed) {
        console.log(`Force killing process for testId: ${testId}`);
        process.kill("SIGKILL");
      }
    }, 5000);

    // Remove from running processes
    runningProcesses.delete(testId);

    // Notify frontend
    io.emit("testOutput", {
      type: "stopped",
      data: `Test ${testId} has been stopped`,
    });

    return true;
  } catch (error) {
    console.error(`Error stopping test ${testId}:`, error);
    return false;
  }
};

// Get running test status
export const getRunningTests = (): string[] => {
  return Array.from(runningProcesses.keys());
};

// Run a specific test
export const runTest = async (
  test: string,
  profile: string = "LIGHT",
  environment: string = "PROD",
  customToken: string = "",
  testId?: string
): Promise<void> => {
  try {
    const io = getIO();
    const actualTestId = testId || `${test}-${Date.now()}`;

    // Generate timestamp and result file name
    const timestamp = generateTimestamp();
    const testFile = `tests/${test}.js`;
    const resultFile = `results/${timestamp}_${test}.json`;

    // Send initial messages with environment info
    io.emit("testOutput", {
      type: "log",
      data: `🚀 Starting test: ${test} with profile: ${profile} (ID: ${actualTestId})`,
    });

    io.emit("testOutput", {
      type: "log",
      data: `🌐 Environment: ${environment}${
        customToken ? " (Custom Token)" : " (Default Token)"
      }`,
    });

    io.emit("testOutput", {
      type: "log",
      data: `⏰ Started at: ${generateReadableTimestamp()} (Poland time)`,
    });

    io.emit("testOutput", {
      type: "log",
      data: `📁 Results will be saved to: ${resultFile}`,
    });

    // Spawn k6 with environment-specific configuration
    const child = spawn(
      "k6",
      [
        "run",
        testFile,
        "-e",
        `PROFILE=${profile}`,
        "-e",
        `ENVIRONMENT=${environment}`,
        "-e",
        `CUSTOM_TOKEN=${customToken}`,
        "-e",
        "LOG_LEVEL=error",
        "--summary-export",
        resultFile,
      ],
      {
        cwd: K6_TESTS_DIR,
        env: {
          ...process.env,
          // Force terminal behavior that shows progress bars
          TERM: "xterm-256color",
          // Ensure k6 shows progress
          NO_COLOR: "false",
          // Pass environment configuration
          K6_ENVIRONMENT: environment,
          K6_CUSTOM_TOKEN: customToken,
        },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    // Store the process
    runningProcesses.set(actualTestId, child);
    console.log(`Started test ${actualTestId} with PID: ${child.pid}`);

    // Handle process output with better progress bar support
    child.stdout.on("data", (data) => {
      const processedLines = processK6Output(data);

      for (const line of processedLines) {
        if (line) {
          io.emit("testOutput", { type: "log", data: line });
        }
      }
    });

    child.stderr.on("data", (data) => {
      const processedLines = processK6Output(data);

      for (const line of processedLines) {
        if (line) {
          io.emit("testOutput", { type: "error", data: line });
        }
      }
    });

    // Handle process completion
    child.on("close", (code, signal) => {
      // Remove from running processes
      runningProcesses.delete(actualTestId);

      if (signal === "SIGTERM" || signal === "SIGKILL") {
        io.emit("testOutput", {
          type: "stopped",
          data: `🛑 Test ${test} was stopped by user`,
        });
      } else if (code === 0) {
        io.emit("testOutput", {
          type: "complete",
          data: `✅ Test ${test} completed successfully!`,
        });

        io.emit("testOutput", {
          type: "log",
          data: `📊 Results saved to: ${resultFile}`,
        });

        // Trigger refresh of test results with delay to ensure file is written
        setTimeout(() => {
          io.emit("testOutput", {
            type: "log",
            data: "🔄 Refreshing test results dashboard...",
          });

          // Emit specific event for results refresh
          io.emit("resultsUpdated", {
            message: "New test results available",
            testName: test,
            resultFile: resultFile,
            timestamp: timestamp,
          });
        }, 2000);
      } else {
        io.emit("testOutput", {
          type: "error",
          data: `❌ Test ${test} failed with exit code ${code}`,
        });
      }
    });

    // Handle process error
    child.on("error", (error) => {
      console.error(`Error running test ${test}:`, error);
      runningProcesses.delete(actualTestId);
      io.emit("testOutput", {
        type: "error",
        data: `❌ Error running test: ${error.message}`,
      });
    });

    // Handle process spawn
    child.on("spawn", () => {
      console.log(`Test ${actualTestId} spawned successfully`);
    });
  } catch (error) {
    console.error(`Error running test ${test}:`, error);
    throw error;
  }
};

// Run all tests
export const runAllTests = async (
  profile: string = "LIGHT",
  environment: string = "PROD",
  customToken: string = "",
  testId?: string
): Promise<void> => {
  try {
    const io = getIO();
    const actualTestId = testId || `all-tests-${Date.now()}`;

    // Build the command
    const script = path.join(K6_TESTS_DIR, "sequential-tests.sh");
    const args = [profile];

    // Send initial messages with environment info
    io.emit("testOutput", {
      type: "log",
      data: `🚀 Starting all tests sequentially with profile: ${profile} (ID: ${actualTestId})`,
    });

    io.emit("testOutput", {
      type: "log",
      data: `🌐 Environment: ${environment}${
        customToken ? " (Custom Token)" : " (Default Token)"
      }`,
    });

    io.emit("testOutput", {
      type: "log",
      data: `⏰ Started at: ${generateReadableTimestamp()} (Poland time)`,
    });

    // Spawn the process with better terminal support for progress bars
    const child = spawn("bash", [script, ...args], {
      cwd: K6_TESTS_DIR,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        NO_COLOR: "false",
        // Pass environment configuration to the script
        K6_ENVIRONMENT: environment,
        K6_CUSTOM_TOKEN: customToken,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Store the process
    runningProcesses.set(actualTestId, child);
    console.log(`Started all tests ${actualTestId} with PID: ${child.pid}`);

    // Handle process output with progress bar support
    child.stdout.on("data", (data) => {
      const processedLines = processK6Output(data);

      for (const line of processedLines) {
        if (line) {
          io.emit("testOutput", { type: "log", data: line });
        }
      }
    });

    child.stderr.on("data", (data) => {
      const processedLines = processK6Output(data);

      for (const line of processedLines) {
        if (line) {
          io.emit("testOutput", { type: "error", data: line });
        }
      }
    });

    // Handle process completion
    child.on("close", (code, signal) => {
      // Remove from running processes
      runningProcesses.delete(actualTestId);

      if (signal === "SIGTERM" || signal === "SIGKILL") {
        io.emit("testOutput", {
          type: "stopped",
          data: `🛑 All tests were stopped by user`,
        });
      } else if (code === 0) {
        io.emit("testOutput", {
          type: "complete",
          data: "✅ All tests completed successfully!",
        });

        // Trigger refresh of test results with delay
        setTimeout(() => {
          io.emit("testOutput", {
            type: "log",
            data: "🔄 Refreshing test results dashboard...",
          });

          // Emit specific event for results refresh
          io.emit("resultsUpdated", {
            message: "New test results available from sequential run",
            testName: "all",
            timestamp: generateTimestamp(),
          });
        }, 3000);
      } else {
        io.emit("testOutput", {
          type: "error",
          data: `❌ Tests failed with exit code ${code}`,
        });
      }
    });

    // Handle process error
    child.on("error", (error) => {
      console.error("Error running all tests:", error);
      runningProcesses.delete(actualTestId);
      io.emit("testOutput", {
        type: "error",
        data: `❌ Error running tests: ${error.message}`,
      });
    });
  } catch (error) {
    console.error("Error running all tests:", error);
    throw error;
  }
};
