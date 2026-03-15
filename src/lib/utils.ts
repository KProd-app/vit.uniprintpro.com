import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeType });
}
// Helper to normalize strings for search/comparison (removes accents, handles spaces/dots)
export const normalizeString = (str: string) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\./g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

export function getVilniusShiftBoundaries(dateStr?: string) {
    const now = dateStr ? new Date(dateStr) : new Date();
    // Convert current absolute time to essentially "Lithuanian" time string representation
    const vnoStr = now.toLocaleString('en-US', { timeZone: 'Europe/Vilnius', hour12: false });
    const vnoDate = new Date(vnoStr);
    const currentHour = vnoDate.getHours();

    const isDayShift = currentHour >= 6 && currentHour < 18;
    const currentShiftName: "Dieninė" | "Naktinė" = isDayShift ? 'Dieninė' : 'Naktinė';

    let shiftStartLocal = new Date(vnoDate);
    shiftStartLocal.setMinutes(0, 0, 0);

    if (isDayShift) {
        shiftStartLocal.setHours(6);
    } else {
        if (currentHour < 6) {
            shiftStartLocal.setDate(shiftStartLocal.getDate() - 1);
            shiftStartLocal.setHours(18);
        } else {
            shiftStartLocal.setHours(18);
        }
    }

    // Calculate the absolute UTC Date of this shift start by subtracting the offset we artificially created parsing local back as absolute
    const offsetMs = vnoDate.getTime() - now.getTime();
    const shiftStartAbsolute = new Date(shiftStartLocal.getTime() - offsetMs);

    return { shiftStartAbsolute, currentShiftName };
}
