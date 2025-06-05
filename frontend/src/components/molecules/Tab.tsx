import React from "react";

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  customClassName?: string;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick, customClassName }) => {
  const baseClass = "m-tab";
  const activeClass = isActive ? "m-tab--active" : "";
  const finalClassName = [baseClass, activeClass, customClassName].filter(Boolean).join(" ");

  return (
    <button className={finalClassName} onClick={onClick}>
      {label}
    </button>
  );
};

export default Tab;
