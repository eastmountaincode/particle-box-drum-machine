'use client';

import React from 'react';

interface InlineTooltipProps {
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  isVisible: boolean;
}

export const InlineTooltip: React.FC<InlineTooltipProps> = ({
  title,
  content,
  position,
  isVisible
}) => {
  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-0 -mb-4'; // Use negative margin to pull tooltip lower
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
    }
  };

  // White outline triangle
  const getArrowStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      zIndex: 51
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: '100%',
          left: '25%', // Position arrow more toward left side of tooltip
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid white'
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid white'
        };
      case 'left':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '8px solid white'
        };
      case 'right':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '8px solid white'
        };
      default:
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid white'
        };
    }
  };

  // Black fill triangle (smaller, positioned on top)
  const getArrowFillStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      zIndex: 52
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: '100%',
          left: '25%', // Position fill arrow more toward left side of tooltip
          transform: 'translateX(-50%) translateY(-1px)',
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '7px solid black'
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(1px)',
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: '7px solid black'
        };
      case 'left':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(-1px)',
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderLeft: '7px solid black'
        };
      case 'right':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(1px)',
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: '7px solid black'
        };
      default:
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(1px)',
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: '7px solid black'
        };
    }
  };

  return (
    <div className={`absolute z-50 ${getPositionClasses()}`}>
      {/* Arrow with outline effect - white outline triangle */}
      <div style={getArrowStyle()} />
      {/* Arrow fill - black triangle positioned on top */}
      <div style={getArrowFillStyle()} />

      {/* Tooltip content */}
      <div className="bg-black border border-white border-opacity-50 shadow-2xl p-3 w-64">
        <h3 className="font-bold text-sm text-white mb-2">{title}</h3>
        <div className="text-xs leading-relaxed text-white">
          {content.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};