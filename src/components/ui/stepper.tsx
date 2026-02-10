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
                <div className="absolute top-4 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full" />

                {/* Active Line Progress */}
                <div
                    className="absolute top-4 left-0 h-1 bg-mimaki-blue transition-all duration-500 -z-10 rounded-full"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <li key={index} className="flex flex-col items-center relative px-2 bg-mimaki-gray/50 backdrop-blur-sm rounded-xl">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 shadow-sm",
                                    isCompleted
                                        ? "bg-mimaki-blue border-mimaki-blue text-white"
                                        : isCurrent
                                            ? "bg-white border-mimaki-blue text-mimaki-blue ring-4 ring-mimaki-blue/20"
                                            : "bg-white border-slate-300 text-slate-300"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span className="text-sm font-black">{index + 1}</span>
                                )}
                            </div>
                            <div className="mt-2 text-center">
                                <span
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest block transition-colors",
                                        isCompleted || isCurrent ? "text-mimaki-dark" : "text-slate-400"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
