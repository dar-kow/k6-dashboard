import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  customClassName?: string;
}

const Input: React.FC<InputProps> = ({ customClassName, disabled, className, ...props }) => {
  const baseClass = "a-input"; // "a-" prefix for atom
  const disabledClass = disabled ? "a-input--disabled" : "";
  // Allow merging with existing className prop if passed, e.g. by a form library
  const finalClassName = [baseClass, disabledClass, customClassName, className].filter(Boolean).join(" ");

  return <input className={finalClassName} disabled={disabled} {...props} />;
};

export default Input;
