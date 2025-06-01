import React from 'react';
import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface AreaChartProps {
    title?: string;
    data: Array<Record<string, any>>;
    xKey: string;
    yKey: string;
    yLabel?: string;
    color?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({
    title,
    data,
    xKey,
    yKey,
    yLabel,
    color = '#3b82f6',
}) => {
    return (
        <div className="h-full w-full">
            {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
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
                    <Area
                        type="monotone"
                        dataKey={yKey}
                        stroke={color}
                        fill={`${color}33`} // Color with 20% opacity
                        name={yLabel || yKey}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AreaChart;