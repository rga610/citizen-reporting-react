import { z } from "zod";

export const reportSchema = z.object({
  issue_id: z.string().trim().min(1),
  lat: z.number().optional(),
  lon: z.number().optional(),
  accuracy: z.number().optional()
});