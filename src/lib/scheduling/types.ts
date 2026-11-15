// Tipos do motor de horários. Funções puras: nada aqui conhece Supabase ou React.

/** Data no fuso do profissional, "YYYY-MM-DD". */
export type LocalDate = string;

/** Hora de parede no fuso do profissional, "HH:mm". */
export type LocalTime = string;

export type WindowMode = "flexible" | "same_day_only" | "next_day_only";

export type SchedulingSettings = {
  slotDurationMin: number;
  bufferMin: number;
  windowMode: WindowMode;
  minAdvanceDays: number;
  maxAdvanceDays: number;
  minNoticeMinutes: number;
  maxPerDay: number | null;
};

export type TimeInterval = {
  start: LocalTime;
  end: LocalTime;
};

/** Expediente semanal. weekday: 0 = domingo ... 6 = sábado. */
export type WeeklyRule = TimeInterval & {
  weekday: number;
};

/** Dia bloqueado (isBlocked) ou com horário especial (start/end). */
export type AvailabilityException = {
  date: LocalDate;
  isBlocked: boolean;
  start: LocalTime | null;
  end: LocalTime | null;
};

/** Horário ocupado: [start, end), já incluindo o buffer (blocked_until). */
export type BusyRange = {
  start: Date;
  end: Date;
};

/** Horário oferecido: consulta em [start, end); ocupa a agenda até blockedUntil. */
export type Slot = {
  start: Date;
  end: Date;
  blockedUntil: Date;
};

export type DayStatus = "available" | "full" | "closed";
