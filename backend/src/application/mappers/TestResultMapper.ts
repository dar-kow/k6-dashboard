import { TestDirectory, TestFile, TestConfig } from '../../core';
import { TestDirectoryDto, TestFileDto, TestConfigDto } from '../dto';

export class TestResultMapper {
  static toDirectoryDto(directory: TestDirectory): TestDirectoryDto {
    const timestamp = directory.date.getTime();

    console.log(
      `Sending timestamp to frontend: ${directory.name} -> ${timestamp} (${directory.date.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })})`
    );

    console.log('🔍 TestResultMapper mapping directory:', {
      name: directory.name,
      repositoryId: directory.repositoryId,
      repositoryName: directory.repositoryName,
      testName: directory.getTestName?.() || 'N/A',
    });

    const dto: TestDirectoryDto = {
      name: directory.name,
      path: directory.path,
      date: timestamp.toString(),
      type: directory.type,
    };

    if (directory.repositoryId) {
      dto.repositoryId = directory.repositoryId;
    }

    if (directory.repositoryName) {
      dto.repositoryName = directory.repositoryName;
    }

    const testName = directory.getTestName?.();
    if (testName) {
      dto.testName = testName;
    }

    console.log('✅ TestResultMapper created DTO:', {
      name: dto.name,
      repositoryId: dto.repositoryId,
      repositoryName: dto.repositoryName,
      testName: dto.testName,
    });

    return dto;
  }

  static toDirectoriesDto(directories: TestDirectory[]): TestDirectoryDto[] {
    return directories.map(this.toDirectoryDto);
  }

  static toFileDto(file: TestFile): TestFileDto {
    return {
      name: file.name,
      path: file.path,
    };
  }

  static toFilesDto(files: TestFile[]): TestFileDto[] {
    return files.map(this.toFileDto);
  }

  static toConfigDto(config: TestConfig): TestConfigDto {
    return {
      name: config.name,
      description: config.description,
      file: config.file,
    };
  }

  static toConfigsDto(configs: TestConfig[]): TestConfigDto[] {
    return configs.map(this.toConfigDto);
  }
}
