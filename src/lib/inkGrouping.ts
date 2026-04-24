import { PrinterData, PrinterInk } from '../types';

export const MIMAKI_GROUP_ID = 'mimaki-group';
export const DACEN_GROUP_ID = 'dacen-group';

export function getAdminInkPrinters(printers: PrinterData[]): PrinterData[] {
  const result: PrinterData[] = [];
  
  const mimakiPrinters = printers.filter(p => p.isMimaki);
  const dacenPrinters = printers.filter(p => p.id.toLowerCase().includes('dacen'));
  const otherPrinters = printers.filter(p => !p.isMimaki && !p.id.toLowerCase().includes('dacen'));

  // Combine Mimaki
  if (mimakiPrinters.length > 0) {
    const combinedInks = combineInks(mimakiPrinters);
    result.push({
      ...mimakiPrinters[0],
      id: MIMAKI_GROUP_ID,
      name: 'Mimaki',
      inks: combinedInks
    });
  }

  // Combine Dacen
  if (dacenPrinters.length > 0) {
    const combinedInks = combineInks(dacenPrinters);
    result.push({
      ...dacenPrinters[0],
      id: DACEN_GROUP_ID,
      name: 'Dacen',
      inks: combinedInks
    });
  }

  return [...result, ...otherPrinters];
}

export function getUserInkPrinters(printers: PrinterData[]): PrinterData[] {
  const result: PrinterData[] = [];
  
  const mimakiPrinters = printers.filter(p => p.isMimaki);
  const otherPrinters = printers.filter(p => !p.isMimaki);

  // Combine Mimaki ONLY for users
  if (mimakiPrinters.length > 0) {
    const combinedInks = combineInks(mimakiPrinters);
    result.push({
      ...mimakiPrinters[0],
      id: MIMAKI_GROUP_ID,
      name: 'Mimaki',
      inks: combinedInks
    });
  }

  // Users see separate Dacen printers, so we don't group them here
  return [...result, ...otherPrinters];
}

// Helper to get unique inks across a group of printers
function combineInks(printers: PrinterData[]): PrinterInk[] {
  const inkMap = new Map<string, PrinterInk>();
  printers.forEach(p => {
    (p.inks || []).forEach(ink => {
      inkMap.set(ink.id, ink); // Last one overwrites, assuming they are synced
    });
  });
  return Array.from(inkMap.values());
}

export async function syncGroupedInks(
  groupId: string, 
  newInks: PrinterInk[], 
  allPrinters: PrinterData[], 
  updatePrinter: (id: string, updates: Partial<PrinterData>) => Promise<void>
) {
  const promises: Promise<void>[] = [];

  if (groupId === MIMAKI_GROUP_ID) {
    const mimakiIds = allPrinters.filter(p => p.isMimaki).map(p => p.id);
    for (const id of mimakiIds) {
      promises.push(updatePrinter(id, { inks: newInks }));
    }
  } else if (groupId === DACEN_GROUP_ID) {
    const dacenIds = allPrinters.filter(p => p.id.toLowerCase().includes('dacen')).map(p => p.id);
    for (const id of dacenIds) {
      promises.push(updatePrinter(id, { inks: newInks }));
    }
  } else {
    promises.push(updatePrinter(groupId, { inks: newInks }));
  }

  await Promise.all(promises);
}
