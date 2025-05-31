import { memo } from 'react';
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';
import { BaseChart, BaseChartProps } from './BaseChart';
import { APP_CONSTANTS } from '@utils/constants';

export interface PieChartProps extends Omit<BaseChartProps, 'children'> {
    title?: string;  // Added title prop
    data: Array<Record<string, any>>;
    nameKey: string;
    valueKey: string;
    colors?: string[];
    showLabels?: boolean;
    showLegend?: boolean;
}

const DEFAULT_COLORS = [
    APP_CONSTANTS.CHART_COLORS.PRIMARY,
    APP_CONSTANTS.CHART_COLORS.SUCCESS,
    APP_CONSTANTS.CHART_COLORS.WARNING,
    APP_CONSTANTS.CHART_COLORS.ERROR,
    APP_CONSTANTS.CHART_COLORS.INFO,
    APP_CONSTANTS.CHART_COLORS.SECONDARY,
];

export const PieChart = memo<PieChartProps>(({
    title,  // Added title
    data,
    nameKey,
    valueKey,
    colors = DEFAULT_COLORS,
    showLabels = true,
    showLegend = true,
    ...baseProps
}) => {
    const total = data.reduce((acc, item) => acc + (item[valueKey] || 0), 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = total > 0 ? ((data[valueKey] / total) * 100).toFixed(1) : '0';

            return (
                <div className="pie-chart-tooltip">
                    <p className="pie-chart-tooltip__label">{data[nameKey]}</p>
                    <p className="pie-chart-tooltip__value">
                        {data[valueKey].toLocaleString()} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderLabel = ({ name, value }: any) => {
        if (!showLabels) return '';
        const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
        return `${percentage}%`;
    };

    return (
        <div className="pie-chart">
            {title && <h3 className="chart-title">{title}</h3>}
            <BaseChart {...baseProps}>
                <RechartsPieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={valueKey}
                        nameKey={nameKey}
                    >
                        {data.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>

                    <Tooltip content={<CustomTooltip />} />

                    {showLegend && (
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '12px',
                            }}
                        />
                    )}
                </RechartsPieChart>
            </BaseChart>
        </div>
    );
});

PieChart.displayName = 'PieChart';
export default PieChart;