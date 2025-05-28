export interface CreateRepositoryDto {
  name: string;
  url: string;
  branch?: string;
}

export interface RepositoryDto {
  id: string;
  name: string;
  url: string;
  branch: string;
  createdAt: string;
  lastSync?: string;
  needsSync: boolean;
}

export interface RepositoryConfigDto {
  hosts: {
    PROD: string;
    DEV: string;
  };
  tokens: {
    PROD: {
      USER?: string;
      ADMIN?: string;
    };
    DEV: {
      USER?: string;
      ADMIN?: string;
    };
  };
  loadProfiles: {
    [key: string]: {
      vus: number;
      duration: string;
    };
  };
  availableProfiles: string[];
}
