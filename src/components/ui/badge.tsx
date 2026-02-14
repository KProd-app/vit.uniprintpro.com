import * as React from "react";
import { cn } from "@/lib/utils";
import { PrinterStatus } from "../../types";

type StatusVariant = "default" | "success" | "warning" | "destructive" | "outline" | "secondary" | "mimaki";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: PrinterStatus | string;
    variant?: StatusVariant;
    className?: string;
    children?: React.ReactNode;
}

function getVariantFromStatus(status: PrinterStatus | string): StatusVariant {
    switch (status) {
        case PrinterStatus.WORKING:
            return "mimaki"; // Blue for working
        case PrinterStatus.READY_TO_WORK:
            return "success";
        case PrinterStatus.IN_PROGRESS:
            return "warning";
        case PrinterStatus.ENDING_SHIFT:
            return "secondary";
        case PrinterStatus.NOT_STARTED:
        default:
            return "outline";
    }
}

function StatusBadge({ className, variant, status, children, ...props }: StatusBadgeProps) {
    const finalVariant = variant || (status ? getVariantFromStatus(status) : "default");

    const variants = {
        default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
        secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
        outline: "text-slate-500 border-slate-200",
        success: "border-transparent bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
        warning: "border-transparent bg-amber-500 text-white shadow-lg shadow-amber-500/20",
        mimaki: "border-transparent bg-mimaki-blue text-white shadow-lg shadow-mimaki-blue/30",
    };

    return (
        <div className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all", variants[finalVariant], className)} {...props}>
            {children || status}
        </div>
    );
}

export { StatusBadge };
