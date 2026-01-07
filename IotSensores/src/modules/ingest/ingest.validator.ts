import { z } from 'zod';

export const batteryLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'CRITICAL']);

export const ingestPayloadSchema = z.object({
  serial_number: z
    .string()
    .min(1, 'serial_number is required')
    .max(50, 'serial_number must be at most 50 characters'),
  temperature: z
    .number()
    .min(-50, 'temperature must be at least -50')
    .max(100, 'temperature must be at most 100'),
  humidity: z
    .number()
    .min(0, 'humidity must be at least 0')
    .max(100, 'humidity must be at most 100'),
  battery_level: batteryLevelSchema,
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;

export function validateIngestPayload(data: unknown): {
  success: boolean;
  data?: IngestPayload;
  error?: string;
} {
  const result = ingestPayloadSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');

  return { success: false, error: errorMessage };
}
