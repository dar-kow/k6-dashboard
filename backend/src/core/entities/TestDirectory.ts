export class TestDirectory {
  constructor(
    public readonly name: string,
    public readonly path: string,
    public readonly date: Date,
    public readonly type: 'directory' | 'virtual' = 'directory',
    public readonly repositoryId?: string,
    public readonly repositoryName?: string
  ) {}

  isVirtual(): boolean {
    return this.type === 'virtual' || this.name.endsWith('.json');
  }

  isSequential(): boolean {
    return this.name.includes('sequential_');
  }

  isParallel(): boolean {
    return this.name.includes('parallel_');
  }

  getTestType(): string {
    if (this.isVirtual()) return 'Individual Test';
    if (this.isSequential()) return 'Sequential Run';
    if (this.isParallel()) return 'Parallel Run';
    return 'Test Run';
  }

  getTestName(): string {
    if (this.isVirtual()) {
      const fileName = this.name.split('/').pop() || '';
      return fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
    }
    return this.name;
  }

  getDisplayName(): string {
    const testName = this.getTestName();
    if (this.repositoryName && this.isVirtual()) {
      return `${this.repositoryName} / ${this.formatTestName(testName)}`;
    }
    if (this.repositoryName) {
      return `${this.repositoryName} - ${this.getTestType()}`;
    }
    return this.formatTestName(testName);
  }

  private formatTestName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
