import { Booking, WEEKLY_LIMIT_MINUTES } from './types';

// Helper to format dates
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
};

// Generate slots for the day (08:00 to 22:00)
export const generateDailySlots = (): Date[] => {
  const slots: Date[] = [];
  const startHour = 8;
  const endHour = 22; // 10 PM
  const now = new Date();
  
  for (let h = startHour; h < endHour; h++) {
    const d1 = new Date(now);
    d1.setHours(h, 0, 0, 0);
    slots.push(d1);
    
    const d2 = new Date(now);
    d2.setHours(h, 30, 0, 0);
    slots.push(d2);
  }
  return slots;
};

// Check if two time ranges overlap
export const doIntervalsOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  return startA < endB && startB < endA;
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

export const getBookingsForUserThisWeek = (bookings: Booking[], userId: string, currentRefDate: Date): Booking[] => {
  const weekStart = getWeekStart(currentRefDate);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return bookings.filter(b => {
    const bookingStart = new Date(b.startTime);
    return b.userId === userId && bookingStart >= weekStart && bookingStart < weekEnd;
  });
};

// Calculates TOTAL minutes (for achievement stats)
export const calculateWeeklyMinutes = (bookings: Booking[]): number => {
  return bookings.reduce((acc, curr) => acc + curr.durationMinutes, 0);
};

// Definition of Work Hours: Mon-Fri, Before 6 PM (18:00)
export const isWorkHours = (date: Date): boolean => {
  const day = date.getDay();
  const hour = date.getHours();
  const isWeekend = day === 0 || day === 6; // Sunday=0, Saturday=6
  const isAfterHours = hour >= 18; // 18:00 onwards
  return !isWeekend && !isAfterHours;
};

// Calculates QUOTA minutes (only work hours count toward limit)
export const calculateQuotaMinutes = (bookings: Booking[]): number => {
  return bookings.reduce((acc, curr) => {
    if (isWorkHours(new Date(curr.startTime))) {
        return acc + curr.durationMinutes;
    }
    return acc;
  }, 0);
};

// Check if a potential new slot overlaps with ANY existing booking (Global Team Constraint)
export const checkGlobalConflict = (
  newStart: Date, 
  newEnd: Date, 
  allBookings: Booking[], 
  excludeBookingId?: string
): Booking | null => {
  return allBookings.find(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return doIntervalsOverlap(newStart, newEnd, bStart, bEnd);
  }) || null;
};

export const canUserBookMinutes = (
  userBookings: Booking[], 
  minutesToBook: number,
  newBookingStart: Date
): boolean => {
  // If booking is during off-hours (Weekend or >6pm), it doesn't count toward limit
  if (!isWorkHours(newBookingStart)) {
    return true;
  }

  // Otherwise check quota
  const currentQuotaUsage = calculateQuotaMinutes(userBookings);
  return (currentQuotaUsage + minutesToBook) <= WEEKLY_LIMIT_MINUTES;
};

export const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};