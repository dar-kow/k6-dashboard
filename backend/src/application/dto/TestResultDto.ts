export interface TestDirectoryDto {
  name: string;
  path: string;
  date: string;
  type?: 'directory' | 'virtual';
  repositoryId?: string | undefined;
  repositoryName?: string | undefined;
  testName?: string | undefined;
}

export interface TestFileDto {
  name: string;
  path: string;
}

export interface TestConfigDto {
  name: string;
  description: string;
  file: string;
}
