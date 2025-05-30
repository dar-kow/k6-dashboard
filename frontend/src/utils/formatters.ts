export class Formatters {
  static number(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat("en-US", options).format(value);
  }

  static currency(value: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  }

  static percentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  static bytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  static duration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }

  static date(
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Warsaw",
    };

    return dateObj.toLocaleString("pl-PL", { ...defaultOptions, ...options });
  }

  static relativeTime(date: Date | string | number): string {
    const now = new Date();
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    const diffMs = now.getTime() - dateObj.getTime();

    const units = [
      { name: "year", ms: 31536000000 },
      { name: "month", ms: 2592000000 },
      { name: "week", ms: 604800000 },
      { name: "day", ms: 86400000 },
      { name: "hour", ms: 3600000 },
      { name: "minute", ms: 60000 },
      { name: "second", ms: 1000 },
    ];

    for (const unit of units) {
      const value = Math.floor(diffMs / unit.ms);
      if (value > 0) {
        return `${value} ${unit.name}${value !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  }

  static testName(name: string): string {
    return name
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
