export interface TestDirectoryDto {
  name: string;
  path: string;
  date: string;
  type?: "directory" | "virtual";
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
