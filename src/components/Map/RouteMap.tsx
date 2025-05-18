
import React from 'react';
import { RouteMapProps } from './types';

const RouteMap = ({ 
  height = '320px',
  className = ''
}: RouteMapProps) => {
  // Apply custom CSS styles for the map container
  const mapStyles = {
    height,
    position: 'relative' as const,
    borderRadius: className.includes('rounded') ? 'inherit' : '0',
  };

  return (
    <div className={`route-map ${className} bg-muted flex items-center justify-center`} style={mapStyles}>
      <p className="text-muted-foreground">Map display is currently disabled</p>
    </div>
  );
}

export default RouteMap;
