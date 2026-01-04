import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', style }) => {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}
      style={style}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
