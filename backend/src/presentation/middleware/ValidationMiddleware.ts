import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../core';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  allowedValues?: any[];
  minLength?: number;
  maxLength?: number;
}

export class ValidationMiddleware {
  static validateBody(rules: ValidationRule[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        for (const rule of rules) {
          const value = req.body[rule.field];

          // Required field validation
          if (rule.required && (value === undefined || value === null || value === '')) {
            throw new ValidationError(rule.field, 'is required');
          }

          // Skip further validation if field is not required and empty
          if (!rule.required && (value === undefined || value === null || value === '')) {
            continue;
          }

          // Type validation
          if (rule.type && typeof value !== rule.type) {
            throw new ValidationError(rule.field, `must be of type ${rule.type}`);
          }

          // Allowed values validation
          if (rule.allowedValues && !rule.allowedValues.includes(value)) {
            throw new ValidationError(
              rule.field,
              `must be one of: ${rule.allowedValues.join(', ')}`
            );
          }

          // String length validation
          if (rule.type === 'string' && typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
              throw new ValidationError(
                rule.field,
                `must be at least ${rule.minLength} characters long`
              );
            }
            if (rule.maxLength && value.length > rule.maxLength) {
              throw new ValidationError(
                rule.field,
                `must be no more than ${rule.maxLength} characters long`
              );
            }
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static validateParams(rules: ValidationRule[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        for (const rule of rules) {
          const value = req.params[rule.field];

          if (rule.required && !value) {
            throw new ValidationError(rule.field, 'parameter is required');
          }

          if (rule.type && value && typeof value !== rule.type) {
            throw new ValidationError(rule.field, `parameter must be of type ${rule.type}`);
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
