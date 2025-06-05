import React, { memo } from "react";
import React from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
    data: Array<{ name: string; value: number }>;
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
                data={data}
                margin={{
                    top: 5,
                    right: 5,
                    left: 0,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                />
            </RechartsLineChart>
        </ResponsiveContainer>
    );
};

export default memo(LineChart);