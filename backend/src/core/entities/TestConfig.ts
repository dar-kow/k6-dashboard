export class TestConfig {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly file: string
  ) {}

  getFormattedDescription(): string {
    return this.name
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
