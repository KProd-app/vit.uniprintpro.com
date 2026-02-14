import { PrinterData, PrinterStatus, ChecklistTemplate } from '../types';
import { INITIAL_VIT_CHECKLIST } from '../constants';

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

    // Check if all items in the checklist are true
    const allChecked = expectedItems.every(item => printer.vit.checklist[item]);

    // Check other requirements
    return allChecked &&
        printer.vit.confirmed &&
        !!printer.vit.signature &&
        printer.vit.signature.length > 2;
};

export const canStartWork = (printer: PrinterData, checklistTemplates?: ChecklistTemplate[]): boolean => {
    if (printer.status === PrinterStatus.WORKING) return false;

    return isMaintenanceDone(printer) &&
        areNozzlesReady(printer) &&
        isVITChecklistComplete(printer, checklistTemplates);
};
