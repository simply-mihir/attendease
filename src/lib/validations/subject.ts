import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  instructorName: z.string().optional(),
  minAttendancePct: z.number().min(0).max(100).default(75),
  semesterId: z.string().optional(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#6366F1"),
  icon: z.string().optional().default("book"),
  reminderEnabled: z.boolean().optional().default(true),
  reminderBeforeMin: z.number().min(5).max(60).optional().default(15),
});

export const createScheduleSchema = z.object({
  subjectId: z.string().min(1),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().optional(),
  building: z.string().optional(),
});

export const markAttendanceSchema = z.object({
  subjectId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "absent", "late", "excused", "cancelled", "holiday"]),
  scheduleId: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(["manual", "quick_widget", "notification", "bulk", "extra_class"]).optional().default("manual"),
  weight: z.number().min(1).optional().default(1),
});

export const createOverrideSchema = z.object({
  subjectId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["reschedule", "cancel", "extra", "swap"]),
  originalTime: z.string().optional(),
  newTime: z.string().optional(),
  note: z.string().optional(),
  weight: z.number().min(1).optional().default(1),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      subjectId: z.string().min(1),
      scheduleId: z.string().optional(),
      status: z.enum(["present", "absent", "late", "excused", "cancelled", "holiday"]),
    })
  ),
});
