export class ProcessUtils {
  static cleanAnsiCodes(text: string): string {
    return text.replace(/\x1b\[[0-9;]*[mGKH]/g, "");
  }

  static isK6ProgressLine(line: string): boolean {
    const cleaned = this.cleanAnsiCodes(line);
    return (
      cleaned.includes("default [") &&
      cleaned.includes("%") &&
      cleaned.includes("VUs")
    );
  }

  static formatK6ProgressLine(line: string): string {
    const cleaned = this.cleanAnsiCodes(line);

    // Extract percentage, VUs, and time
    const percentMatch = cleaned.match(/\[\s*(\d+)%\s*\]/);
    const vusMatch = cleaned.match(/(\d+)\s+VUs/);
    const timeMatch = cleaned.match(/(\d+m\d+\.\d+s\/\d+m\d+s)/);

    if (percentMatch && vusMatch && timeMatch) {
      const percent = parseInt(percentMatch[1]);
      const vus = vusMatch[1];
      const time = timeMatch[1];

      // Create visual progress bar
      const totalWidth = 40;
      const filledWidth = Math.floor((percent / 100) * totalWidth);
      const emptyWidth = totalWidth - filledWidth;

      const progressBar =
        "=".repeat(filledWidth) + ">" + "-".repeat(Math.max(0, emptyWidth - 1));
      return `default   [${progressBar}] ${vus} VUs  ${time}`;
    }

    return cleaned;
  }

  static processK6Output(data: string): string[] {
    const lines = data.toString().split("\n");
    const processedLines: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const cleanLine = this.cleanAnsiCodes(line);

      if (this.isK6ProgressLine(cleanLine)) {
        const lastIndex = processedLines.length - 1;
        if (
          lastIndex >= 0 &&
          this.isK6ProgressLine(processedLines[lastIndex])
        ) {
          processedLines[lastIndex] = this.formatK6ProgressLine(line);
        } else {
          processedLines.push(this.formatK6ProgressLine(line));
        }
      } else if (cleanLine.trim()) {
        processedLines.push(cleanLine.trim());
      }
    }

    return processedLines;
  }
}
