export class DateUtils {
  static formatPolishDateTime(date: Date): string {
    return date.toLocaleString("pl-PL", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  static generateTimestamp(): string {
    const now = new Date();
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

  static parseK6Timestamp(timestamp: string): Date {
    if (timestamp.match(/^\d{8}_\d{6}$/)) {
      const year = parseInt(timestamp.substr(0, 4));
      const month = parseInt(timestamp.substr(4, 2)) - 1;
      const day = parseInt(timestamp.substr(6, 2));
      const hour = parseInt(timestamp.substr(9, 2));
      const minute = parseInt(timestamp.substr(11, 2));
      const second = parseInt(timestamp.substr(13, 2));

      return new Date(year, month, day, hour, minute, second);
    }

    return new Date();
  }
}
