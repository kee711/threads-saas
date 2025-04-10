import React from "react"

interface DonutChartProps {
    value: number // 0–10 scale
    size?: number // optional size in px, default 120
    strokeWidth?: number // optional stroke width, default 10
    color?: string // stroke color
}

export function DonutChart({
    value,
    size = 120,
    strokeWidth = 10,
    color = "#4F46E5"
}: DonutChartProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 10) * circumference

    return (
        <div className="flex items-center justify-center">
            <svg width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <text
                    x="50%"
                    y="50%"
                    dominantBaseline="central"
                    textAnchor="middle"
                    className="fill-gray-800 text-2xl font-bold"
                >
                    {value}
                </text>
            </svg>
        </div>
    )
}
