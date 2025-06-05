import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number | string;
  customClassName?: string; // Renamed from className to avoid conflict with SVGProps.className
}

// Simple SVG path store (can be expanded or moved to a separate file)
const ICONS: Record<string, string> = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "test-results": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "test-runner": "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  request: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", // Simple warning icon
  "alert-triangle": "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  "check-circle": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  zap: "M13 10V3L4 14h7v7l9-11h-7z", // For rate/throughput
  // Add more icons as needed
};

const Icon: React.FC<IconProps> = ({
  name,
  size = 20, // Default size
  customClassName,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
  viewBox = "0 0 24 24",
  ...props
}) => {
  const pathData = ICONS[name];

  if (!pathData) {
    console.warn(`Icon "${name}" not found.`);
    return <span className={customClassName}>[{name}]</span>; // Fallback for unknown icons
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`a-icon icon-${name} ${customClassName || ""}`} // Added a-icon base class
      {...props}
    >
      <path d={pathData}></path>
    </svg>
  );
};

export default Icon;
