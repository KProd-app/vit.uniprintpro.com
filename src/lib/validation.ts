import { PrinterData, PrinterStatus, ChecklistTemplate } from '../types';
import { INITIAL_VIT_CHECKLIST } from '../constants';
import { getApplicableItems, getCurrentDayOfWeek } from './checklistUtils';

export const isMaintenanceDone = (printer: PrinterData): boolean => {
    return printer.maintenanceDone;
};

export const areNozzlesReady = (printer: PrinterData): boolean => {
    // If not Mimaki, simple check
    if (!printer.isMimaki) {
        return printer.nozzlePrintDone && !!printer.nozzleFile;
    }

    // For Mimaki, check if all selected units have files AND user confirmed printing
    if (!printer.selectedMimakiUnits || printer.selectedMimakiUnits.length === 0) {
        return false;
    }

    const files = printer.mimakiNozzleFiles || {};
    const unitsReady = printer.selectedMimakiUnits.every(unitIndex => !!files[unitIndex]);

    return printer.nozzlePrintDone && unitsReady;
};
export const isVITChecklistComplete = (printer: PrinterData, checklistTemplates?: ChecklistTemplate[]): boolean => {
    if (!printer.vit.shift) return false;

    // Determine expected items
    let expectedItems = INITIAL_VIT_CHECKLIST;
    if (printer.checklistTemplateId && checklistTemplates) {
        const template = checklistTemplates.find(t => t.id === printer.checklistTemplateId);
        if (template) {
            expectedItems = template.items;
        }
    }

    // Filter items based on schedule (day of week and shift)
    const currentDay = getCurrentDayOfWeek();
    const applicableItems = getApplicableItems(expectedItems, currentDay, printer.vit.shift);

    // Check if all applicable items in the checklist are true
    const allChecked = applicableItems.length > 0 ? applicableItems.every(item => printer.vit.checklist[item]) : true;

    // Check other requirements
    return allChecked &&
        printer.vit.confirmed &&
        !!printer.vit.signature &&
        printer.vit.signature.length > 2;
};

export const canStartWork = (printer: PrinterData, checklistTemplates?: ChecklistTemplate[]): boolean => {
    if (printer.status === PrinterStatus.WORKING) return false;

    const nozzleCheckRequired = printer.hasNozzleCheck !== false;

    return (!nozzleCheckRequired || areNozzlesReady(printer)) &&
        isVITChecklistComplete(printer, checklistTemplates);
};
