import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  customClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, title, headerContent, footerContent, customClassName }) => {
  const baseClass = "m-card";
  const finalClassName = [baseClass, customClassName].filter(Boolean).join(" ");

  return (
    <div className={finalClassName}>
      {(title || headerContent) && (
        <div className="m-card__header">
          {title && <h3 className="m-card__title">{title}</h3>}
          {headerContent}
        </div>
      )}
      <div className="m-card__body">{children}</div>
      {footerContent && <div className="m-card__footer">{footerContent}</div>}
    </div>
  );
};

export default Card;
