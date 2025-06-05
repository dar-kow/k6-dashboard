import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  customClassName?: string; // Allow passing additional classes
}

const Button: React.FC<ButtonProps> = ({ children, variant = "primary", customClassName, disabled, ...props }) => {
  const baseClass = "btn";
  const variantClass = `btn--${variant}`;
  const disabledClass = disabled ? "btn--disabled" : "";

  const finalClassName = [baseClass, variantClass, disabledClass, customClassName].filter(Boolean).join(" ");

  return (
    <button className={finalClassName} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
