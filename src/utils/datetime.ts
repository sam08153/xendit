/**
 * Time utilities for restaurant operating hours
 */

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within open/close range
 */
export function isTimeWithinRange(currentTime: string, openTime: string, closeTime: string): boolean {
  const current = parseTimeToMinutes(currentTime);
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);
  return current >= open && current <= close;
}

/**
 * Get current day and time in local timezone
 */
export function getCurrentDayAndTime(): { day: string; time: string } {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[now.getDay()];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  return { day, time };
}
