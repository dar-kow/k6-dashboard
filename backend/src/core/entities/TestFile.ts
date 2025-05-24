export class TestFile {
  constructor(public readonly name: string, public readonly path: string) {}

  getTestName(): string {
    return this.name.replace(".json", "");
  }

  getFormattedName(): string {
    return this.getTestName()
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
