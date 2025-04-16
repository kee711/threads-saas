// components/ui/progress.tsx
import * as React from "react"

interface ProgressWithLabelProps {
    value: number
    label?: string
}

export function Progress({ value, label }: ProgressWithLabelProps) {
    return (
        <div className="w-full">
            {label && (
                <div className="mb-1 flex justify-between text-sm font-medium text-gray-700">
                    <span>{label}</span>
                    <span>{value}%</span>
                </div>
            )}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-in-out"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

