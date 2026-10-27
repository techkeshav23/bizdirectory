import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/** Validates & transforms an argument against a Zod schema. */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstMsg = Object.values(fieldErrors)
        .flat()
        .filter(Boolean)[0] as string | undefined;
      throw new BadRequestException({
        message: firstMsg ?? 'Please check the highlighted fields.',
        errors: fieldErrors,
      });
    }
    return result.data;
  }
}
