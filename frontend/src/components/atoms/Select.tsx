import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  customClassName?: string;
}

const Select: React.FC<SelectProps> = ({ children, customClassName, disabled, className, ...props }) => {
  const baseClass = "a-select";
  const disabledClass = disabled ? "a-select--disabled" : "";
  const finalClassName = [baseClass, disabledClass, customClassName, className].filter(Boolean).join(" ");

  return (
    <select className={finalClassName} disabled={disabled} {...props}>
      {children}
    </select>
  );
};

export default Select;
