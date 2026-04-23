export interface ParsedChecklistItem {
  original: string;
  text: string;
  days?: number[]; // 1=Mon, 7=Sun
  shifts?: string[]; // "Dieninė", "Naktinė"
}

/**
 * Parses a checklist item string into text, days and shifts.
 * Expected format: `SCHEDULE:{"d":[1,3],"s":["Dieninė"]}|Text content`
 */
export const parseChecklistItem = (item: string): ParsedChecklistItem => {
  if (item.startsWith('SCHEDULE:')) {
    const pipeIndex = item.indexOf('|');
    if (pipeIndex > -1) {
      const jsonStr = item.substring(9, pipeIndex);
      const text = item.substring(pipeIndex + 1);
      try {
        const config = JSON.parse(jsonStr);
        return {
          original: item,
          text,
          days: config.d && Array.isArray(config.d) && config.d.length > 0 ? config.d : undefined,
          shifts: config.s && Array.isArray(config.s) && config.s.length > 0 ? config.s : undefined,
        };
      } catch (e) {
        // Fallback if parsing fails
        return { original: item, text };
      }
    }
  }
  return { original: item, text: item };
};

/**
 * Formats data back into the raw checklist item string.
 */
export const formatChecklistItem = (text: string, days?: number[], shifts?: string[]): string => {
  const config: any = {};
  if (days && days.length > 0) config.d = days;
  if (shifts && shifts.length > 0) config.s = shifts;
  
  if (Object.keys(config).length > 0) {
    return `SCHEDULE:${JSON.stringify(config)}|${text}`;
  }
  return text;
};

/**
 * Filters an array of checklist items to only those applicable to the given day and shift.
 */
export const getApplicableItems = (items: string[], currentDay: number, currentShift?: string): string[] => {
  return items.filter(item => {
    const parsed = parseChecklistItem(item);
    
    // Check days
    if (parsed.days && parsed.days.length > 0) {
      if (!parsed.days.includes(currentDay)) {
        return false;
      }
    }
    
    // Check shifts
    if (currentShift && parsed.shifts && parsed.shifts.length > 0) {
      if (!parsed.shifts.includes(currentShift)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Gets the current day of the week (1-7 where 1=Monday, 7=Sunday).
 */
export const getCurrentDayOfWeek = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
};
