import { describe, it, expect } from '@jest/globals';
import { TestDirectory } from '../../../../src/core/entities/TestDirectory';

describe('TestDirectory', () => {
  describe('constructor', () => {
    it('should create a TestDirectory instance with all properties', () => {
      const date = new Date('2023-05-21T18:51:06.000Z');
      const directory = new TestDirectory('test-dir', '/path/to/test-dir', date, 'directory');

      expect(directory.name).toBe('test-dir');
      expect(directory.path).toBe('/path/to/test-dir');
      expect(directory.date).toBe(date);
      expect(directory.type).toBe('directory');
    });

    it('should default type to "directory" when not provided', () => {
      const date = new Date('2023-05-21T18:51:06.000Z');
      const directory = new TestDirectory('test-dir', '/path/to/test-dir', date);

      expect(directory.type).toBe('directory');
      expect(directory.isVirtual()).toBe(false);
    });
  });

  describe('isVirtual', () => {
    it('should return true for virtual type', () => {
      const directory = new TestDirectory('test.json', '/path/to/test.json', new Date(), 'virtual');
      expect(directory.isVirtual()).toBe(true);
    });

    it('should return true for names ending with .json', () => {
      const directory = new TestDirectory(
        'test.json',
        '/path/to/test.json',
        new Date(),
        'directory'
      );
      expect(directory.isVirtual()).toBe(true);
    });

    it('should return false for regular directories', () => {
      const directory = new TestDirectory('test-dir', '/path/to/test-dir', new Date(), 'directory');
      expect(directory.isVirtual()).toBe(false);
    });
  });

  describe('isSequential', () => {
    it('should return true for sequential directories', () => {
      const directory = new TestDirectory('sequential_20230521_185106', '/path', new Date());
      expect(directory.isSequential()).toBe(true);
    });

    it('should return false for non-sequential directories', () => {
      const directory = new TestDirectory('parallel_20230521_185106', '/path', new Date());
      expect(directory.isSequential()).toBe(false);
    });
  });

  describe('isParallel', () => {
    it('should return true for parallel directories', () => {
      const directory = new TestDirectory('parallel_20230521_185106', '/path', new Date());
      expect(directory.isParallel()).toBe(true);
    });

    it('should return false for non-parallel directories', () => {
      const directory = new TestDirectory('sequential_20230521_185106', '/path', new Date());
      expect(directory.isParallel()).toBe(false);
    });
  });

  describe('getTestType', () => {
    it('should return "Individual Test" for virtual directories', () => {
      const directory = new TestDirectory('test.json', '/path', new Date(), 'virtual');
      expect(directory.getTestType()).toBe('Individual Test');
    });

    it('should return "Sequential Run" for sequential directories', () => {
      const directory = new TestDirectory('sequential_20230521_185106', '/path', new Date());
      expect(directory.getTestType()).toBe('Sequential Run');
    });

    it('should return "Parallel Run" for parallel directories', () => {
      const directory = new TestDirectory('parallel_20230521_185106', '/path', new Date());
      expect(directory.getTestType()).toBe('Parallel Run');
    });

    it('should return "Test Run" for other directories', () => {
      const directory = new TestDirectory('other_20230521_185106', '/path', new Date());
      expect(directory.getTestType()).toBe('Test Run');
    });
  });
});
