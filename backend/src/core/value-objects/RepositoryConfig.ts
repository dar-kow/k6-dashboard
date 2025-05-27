export interface HostConfig {
  PROD: string;
  DEV: string;
}

export interface TokenConfig {
  PROD: {
    USER?: string;
    ADMIN?: string;
  };
  DEV: {
    USER?: string;
    ADMIN?: string;
  };
}

export interface LoadProfile {
  vus: number;
  duration: string;
}

export interface LoadProfiles {
  LIGHT: LoadProfile;
  MEDIUM: LoadProfile;
  HEAVY: LoadProfile;
  SPIKE?: LoadProfile;
  [key: string]: LoadProfile | undefined;
}

export class RepositoryConfig {
  constructor(
    public readonly hosts: HostConfig,
    public readonly tokens: TokenConfig,
    public readonly loadProfiles: LoadProfiles,
    public readonly defaultProfile: LoadProfile
  ) {}

  getHost(environment: 'PROD' | 'DEV'): string {
    return this.hosts[environment];
  }

  getToken(environment: 'PROD' | 'DEV', role: 'USER' | 'ADMIN' = 'USER'): string | undefined {
    return this.tokens[environment]?.[role];
  }

  getLoadProfile(name: string): LoadProfile | undefined {
    return this.loadProfiles[name];
  }

  getAvailableProfiles(): string[] {
    return Object.keys(this.loadProfiles).filter((key) => this.loadProfiles[key] !== undefined);
  }
}
