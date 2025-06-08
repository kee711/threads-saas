// components/ui/growth-donut.tsx
"use client";

import React from "react";

interface GrowthDonutProps {
    currentValue: number;
    previousValue: number;
    size?: number;
    strokeWidth?: number;
    showPercentage?: boolean;
}

const getColorForGrowth = (percentage: number): string => {
    if (percentage >= 20) return "#4F46E5"; // Blue for high growth
    if (percentage >= 5) return "#FBBF24"; // Yellow for moderate growth
    if (percentage >= 0) return "#84CC16"; // Green for slight growth
    return "#EF4444"; // Red for negative growth
};

export function GrowthDonut({
    currentValue,
    previousValue,
    size = 120,
    strokeWidth = 10,
    showPercentage = true,
}: GrowthDonutProps) {
    // Calculate growth percentage
    const growthPercent = previousValue !== 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : currentValue > 0 ? 100 : 0;

    // Convert to 0-100 scale for the donut visualization
    const normalizedValue = Math.min(Math.max(growthPercent, -100), 100);
    const displayValue = Math.abs(normalizedValue);
    const isNegative = normalizedValue < 0;

    // Calculate the circumference of the circle
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (displayValue / 100) * circumference;

    const chartColor = getColorForGrowth(normalizedValue);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#2c2c3b" // Darker background circle
                strokeWidth={strokeWidth}
                fill="none"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={chartColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${isNegative ? 180 : 0} ${size / 2} ${size / 2})`}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
            <text
                x={size / 2}
                y={size / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fill="#FFFFFF"
            >
                {showPercentage
                    ? `${isNegative ? '-' : ''}${displayValue.toFixed(1)}%`
                    : `${(normalizedValue / 20).toFixed(1)}`}
            </text>
        </svg>
    );
}