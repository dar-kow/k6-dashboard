import { memo } from 'react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { BaseChart, BaseChartProps } from './BaseChart';
import { APP_CONSTANTS } from '@utils/constants';

export interface BarChartProps extends Omit<BaseChartProps, 'children'> {
    title?: string;  // Added title prop
    data: Array<Record<string, any>>;
    xKey: string;
    yKey: string;
    xLabel?: string;
    yLabel?: string;
    color?: string;
}

export const BarChart = memo<BarChartProps>(({
    title,  // Added title
    data,
    xKey,
    yKey,
    xLabel,
    yLabel,
    color = APP_CONSTANTS.CHART_COLORS.PRIMARY,
    ...baseProps
}) => {
    return (
        <div className="bar-chart">
            {title && <h3 className="chart-title">{title}</h3>}
            <BaseChart {...baseProps}>
                <RechartsBarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                    <XAxis
                        dataKey={xKey}
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickLine={{ stroke: '#e0e0e0' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                        {...(xLabel && { label: { value: xLabel, position: 'insideBottom', offset: -10 } })}
                    />

                    <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickLine={{ stroke: '#e0e0e0' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                        {...(yLabel && { label: { value: yLabel, angle: -90, position: 'insideLeft' } })}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                        }}
                        labelStyle={{ color: '#333', fontWeight: 'bold' }}
                    />

                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px',
                        }}
                    />

                    <Bar
                        dataKey={yKey}
                        fill={color}
                        name={yLabel || yKey}
                        radius={[4, 4, 0, 0]}
                    />
                </RechartsBarChart>
            </BaseChart>
        </div>
    );
});

BarChart.displayName = 'BarChart';
export default BarChart;