import React from 'react';
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface PieChartProps {
    title?: string;
    data: Array<Record<string, any>>;
    nameKey: string;
    valueKey: string;
    colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
    title,
    data,
    nameKey,
    valueKey,
    colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
}) => {
    // Calculate total value for percentage
    const total = data.reduce((acc, item) => acc + (item[valueKey] || 0), 0);

    // Custom tooltip that shows percentage
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            const percentage = ((value / total) * 100).toFixed(2);
            const name = payload[0].name;

            return (
                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-sm">
                    <p className="font-medium">{name}</p>
                    <p className="text-gray-600">
                        {value.toLocaleString()} ({percentage}%)
                    </p>
                </div>
            );
        }

        return null;
    };

    // Add percentage to the legend - Fixed typing
    const renderLegendText = (value: string, entry: any) => {
        if (!entry || !entry.payload) return value;

        const { payload } = entry;
        const percentage = ((payload.value / total) * 100).toFixed(2);
        return `${value} (${percentage}%)`;
    };

    return (
        <div className="h-full w-full">
            {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={valueKey}
                        nameKey={nameKey}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={renderLegendText} />
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PieChart;