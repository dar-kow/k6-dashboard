export class TestDirectory {
  constructor(
    public readonly name: string,
    public readonly path: string,
    public readonly date: Date,
    public readonly type: "directory" | "virtual" = "directory"
  ) {}

  isVirtual(): boolean {
    return this.type === "virtual" || this.name.endsWith(".json");
  }

  isSequential(): boolean {
    return this.name.includes("sequential_");
  }

  isParallel(): boolean {
    return this.name.includes("parallel_");
  }

  getTestType(): string {
    if (this.isVirtual()) return "Individual Test";
    if (this.isSequential()) return "Sequential Run";
    if (this.isParallel()) return "Parallel Run";
    return "Test Run";
  }
}
