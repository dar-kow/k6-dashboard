import { memo } from 'react';
import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { BaseChart, BaseChartProps } from './BaseChart';
import { APP_CONSTANTS } from '@utils/constants';

export interface AreaChartProps extends Omit<BaseChartProps, 'children'> {
    title?: string;  // Added title prop
    data: Array<Record<string, any>>;
    xKey: string;
    yKey: string;
    xLabel?: string;
    yLabel?: string;
    color?: string;
    gradient?: boolean;
}

export const AreaChart = memo<AreaChartProps>(({
    title,  // Added title
    data,
    xKey,
    yKey,
    xLabel,
    yLabel,
    color = APP_CONSTANTS.CHART_COLORS.PRIMARY,
    gradient = true,
    ...baseProps
}) => {
    const gradientId = `gradient-${yKey}`;

    return (
        <div className="area-chart">
            {title && <h3 className="chart-title">{title}</h3>}
            <BaseChart {...baseProps}>
                <RechartsAreaChart data={data}>
                    <defs>
                        {gradient && (
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                            </linearGradient>
                        )}
                    </defs>

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

                    <Area
                        type="monotone"
                        dataKey={yKey}
                        stroke={color}
                        fill={gradient ? `url(#${gradientId})` : color}
                        strokeWidth={2}
                        name={yLabel || yKey}
                    />
                </RechartsAreaChart>
            </BaseChart>
        </div>
    );
});

AreaChart.displayName = 'AreaChart';
export default AreaChart;