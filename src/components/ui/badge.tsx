import * as React from "react";
import { cn } from "@/lib/utils";
import { PrinterStatus } from "../../types";

type StatusVariant = "default" | "success" | "warning" | "destructive" | "outline" | "secondary";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: PrinterStatus | string;
    variant?: StatusVariant;
}

function getVariantFromStatus(status: PrinterStatus | string): StatusVariant {
    switch (status) {
        case PrinterStatus.WORKING:
            return "success";
        case PrinterStatus.READY_TO_WORK:
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
        outline: "text-slate-950",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
    };

    return (
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2", variants[finalVariant], className)} {...props}>
            {children || status}
        </div>
    );
}

export { StatusBadge };
