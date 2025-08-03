import React from 'react';
import aegisLogoPath from "@assets/AEGIS LOGO trans_1754162978230.png";

interface BusinessLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export default function BusinessLogo({ 
  size = 'md', 
  variant = 'light', 
  showText = true,
  className = '' 
}: BusinessLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const textColor = variant === 'light' ? '#000000' : '#FFFFFF'; // Black or white
  const accentColor = variant === 'light' ? '#B8860B' : '#DAA520'; // Metallic Gold

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* AEGIS Logo */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <img 
          src={aegisLogoPath} 
          alt="AEGIS Professional Care Logo"
          className="w-full h-full object-contain"
          style={{
            filter: variant === 'dark' ? 'brightness(1.2) contrast(1.1)' : 'none'
          }}
        />
      </div>
      
      {/* Business Name */}
      {showText && (
        <div className="flex flex-col">
          <h1 
            className={`${textSizeClasses[size]} font-bold leading-tight`}
            style={{ color: textColor }}
          >
            AEGIS
          </h1>
          <span 
            className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} font-medium leading-tight opacity-90`}
            style={{ color: accentColor }}
          >
            Professional Care
          </span>
        </div>
      )}
    </div>
  );
}