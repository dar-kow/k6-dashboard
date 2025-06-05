import React, { memo } from "react";
import React from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface DataSeries {
    key: string;
    name: string;
    color?: string;
}

interface MultiLineChartProps {
    title?: string;
    data: Array<Record<string, any>>;
    xKey: string;
    series: DataSeries[];
    yLabel?: string;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({
    title,
    data,
    xKey,
    series,
    yLabel,
}) => {
    // Default colors if not provided
    const defaultColors = [
        '#3b82f6', // blue
        '#ef4444', // red
        '#10b981', // green
        '#f59e0b', // amber
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#14b8a6', // teal
        '#f97316', // orange
    ];

    return (
        <div className="h-full w-full">
            {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey={xKey}
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#E5E7EB' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                        label={
                            yLabel
                                ? { value: yLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }
                                : undefined
                        }
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#E5E7EB' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                        }}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: 10,
                            fontSize: '12px',
                        }}
                    />
                    {series.map((s, index) => (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.name}
                            stroke={s.color || defaultColors[index % defaultColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default memo(MultiLineChart);
