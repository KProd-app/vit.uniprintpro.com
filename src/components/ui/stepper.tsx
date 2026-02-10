import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
    steps: { label: string; description?: string }[];
    currentStep: number;
    className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <div className={cn("w-full", className)}>
            <ol className="flex items-center w-full relative justify-between">
                {/* Connector Line Background */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-200 -z-10" />

                {/* Active Line Progress (approximate based on steps) */}
                <div
                    className="absolute top-4 left-0 h-0.5 bg-slate-900 transition-all duration-500 -z-10"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <li key={index} className="flex flex-col items-center relative bg-slate-50 px-2">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300",
                                    isCompleted
                                        ? "bg-slate-900 border-slate-900 text-white"
                                        : isCurrent
                                            ? "bg-white border-slate-900 text-slate-900"
                                            : "bg-white border-slate-300 text-slate-300"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                )}
                            </div>
                            <div className="mt-2 text-center">
                                <span
                                    className={cn(
                                        "text-xs font-semibold uppercase tracking-wider block",
                                        isCompleted || isCurrent ? "text-slate-900" : "text-slate-500"
                                    )}
                                >
                                    {step.label}
                                </span>
                                {step.description && (
                                    <span className="text-[10px] text-slate-500 hidden sm:block">
                                        {step.description}
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
