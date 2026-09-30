export const SUMMARY_PAGE_MS = 5000;
export const summaryPages = estado => Math.max(1, Math.ceil(Math.max(estado?.llegaron?.length ?? 0, estado?.faltan?.length ?? 0) / 5));
