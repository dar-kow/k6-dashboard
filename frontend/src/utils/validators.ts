export class Validators {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidGitUrl(url: string): boolean {
    const gitUrlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\.git$/;
    return gitUrlRegex.test(url) || this.isValidUrl(url);
  }

  static isNotEmpty(value: string): boolean {
    return value.trim().length > 0;
  }

  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  static isNumeric(value: string): boolean {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  }

  static isPositiveNumber(value: number): boolean {
    return value > 0;
  }

  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidator {
  private rules: Array<() => string | null> = [];

  addRule(rule: () => string | null): this {
    this.rules.push(rule);
    return this;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      const error = rule();
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static required(value: string, fieldName: string): string | null {
    return Validators.isNotEmpty(value) ? null : `${fieldName} is required`;
  }

  static email(value: string): string | null {
    return Validators.isValidEmail(value) ? null : "Invalid email format";
  }

  static url(value: string): string | null {
    return Validators.isValidUrl(value) ? null : "Invalid URL format";
  }

  static gitUrl(value: string): string | null {
    return Validators.isValidGitUrl(value)
      ? null
      : "Invalid Git repository URL";
  }

  static minLength(
    value: string,
    min: number,
    fieldName: string
  ): string | null {
    return Validators.minLength(value, min)
      ? null
      : `${fieldName} must be at least ${min} characters`;
  }
}
