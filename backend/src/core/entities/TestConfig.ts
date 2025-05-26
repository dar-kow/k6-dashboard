export class TestConfig {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly file: string,
    public readonly repository?: string
  ) {}

  getFormattedDescription(): string {
    return this.name
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  isLegacy(): boolean {
    return this.repository === 'legacy' || !this.repository;
  }
}
