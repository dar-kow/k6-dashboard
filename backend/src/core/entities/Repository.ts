export class Repository {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly url: string,
    public readonly branch: string = 'main',
    public readonly createdAt: Date = new Date(),
    public readonly lastSync?: Date
  ) {}

  needsSync(): boolean {
    if (!this.lastSync) return true;
    const hoursSinceSync = (Date.now() - this.lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 1;
  }
}
