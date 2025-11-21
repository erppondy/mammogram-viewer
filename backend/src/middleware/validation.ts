import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { field: string; message: string }[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} is required`,
        });
        continue;
      }

      // Skip further validation if field is not required and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Check type
      if (rule.type) {
        if (rule.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field: rule.field,
              message: rule.message || `${rule.field} must be a valid email`,
            });
          }
        } else if (typeof value !== rule.type) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be a ${rule.type}`,
          });
        }
      }

      // Check minLength
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message:
            rule.message || `${rule.field} must be at least ${rule.minLength} characters long`,
        });
      }

      // Check maxLength
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must be at most ${rule.maxLength} characters long`,
        });
      }

      // Check pattern
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} format is invalid`,
        });
      }

      // Check custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} validation failed`,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
}
