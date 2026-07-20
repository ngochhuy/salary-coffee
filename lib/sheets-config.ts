export const SHEET_URLS: string[] = [
  process.env.NEXT_PUBLIC_SHEET_URL || '',
  process.env.NEXT_PUBLIC_SHEET_URL_OLD || '',
].filter(Boolean);
