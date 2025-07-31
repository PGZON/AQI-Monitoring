import React from 'react';

const LocationButton = ({ 
  onLocationRequest, 
  variant = 'primary', 
  disabled = false,
  children 
}) => {
  const getButtonText = () => {
    if (children) return children;
    
    switch (variant) {
      case 'refresh':
        return 'Refresh Location';
      case 'retry':
        return 'Try Again';
      default:
        return 'Detect My Location';
    }
  };

  const getButtonIcon = () => {
    switch (variant) {
      case 'refresh':
        return '🔄';
      case 'retry':
        return '🔁';
      default:
        return '📍';
    }
  };

  const getButtonClass = () => {
    const baseClass = 'location-button';
    const variantClass = `location-button--${variant}`;
    const disabledClass = disabled ? 'location-button--disabled' : '';
    
    return `${baseClass} ${variantClass} ${disabledClass}`.trim();
  };

  return (
    <button 
      className={getButtonClass()}
      onClick={onLocationRequest}
      disabled={disabled}
      type="button"
    >
      <span className="location-button__icon">{getButtonIcon()}</span>
      <span className="location-button__text">{getButtonText()}</span>
    </button>
  );
};

export default LocationButton;
