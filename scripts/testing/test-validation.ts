import { z } from "zod";

const createOverrideSchema = z.object({
  subjectId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["reschedule", "cancel", "extra", "swap"]),
  originalTime: z.string().optional(),
  newTime: z.string().optional(),
  note: z.string().optional(),
  weight: z.number().min(1).optional().default(1),
});

const payload = {
  subjectId: "csm1...",
  date: "2026-08-21",
  type: "extra",
  originalTime: "10:00",
  newTime: "11:00",
  note: "Extra Class",
  weight: 1,
};

console.log(createOverrideSchema.safeParse(payload));
