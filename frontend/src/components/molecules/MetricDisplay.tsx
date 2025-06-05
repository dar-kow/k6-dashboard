import React from "react";
import Icon from "../atoms/Icon";

interface MetricDisplayProps {
  title: string;
  value: string | number;
  type?: "number" | "rate" | "time" | "size" | "success" | "error" | "health";
  status?: "healthy" | "warning" | "critical" | "unknown";
  iconName?: string;
  unit?: string;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({ title, value, type = "number", status, iconName, unit }) => {
  const baseClass = "metric-display";
  const typeClass = type ? `metric-display--type-${type}` : "";
  // Special handling for rate type based on value for error/success, to be added if needed in SASS
  // e.g. if (type === "rate" && typeof value === "number" && value > 5) statusClass = "metric-display--value-high-error";
  const statusClass = type === "health" && status ? `metric-display--status-${status}` : "";

  const finalClassName = [baseClass, typeClass, statusClass].filter(Boolean).join(" ");

  // Determine statusText for health type
  const statusText = type === "health" ? String(value) : "";

  return (
    <div className={finalClassName}>
      <div className="metric-display__content">
        {iconName && <Icon name={iconName} className="metric-display__icon" />}
        <div className="metric-display__text-content">
            <p className="metric-display__title">{title}</p>
            <p className="metric-display__value">
                {statusText || value}
                {unit && <span className="metric-display__unit">{unit}</span>}
            </p>
        </div>
      </div>
    </div>
  );
};

export default MetricDisplay;
