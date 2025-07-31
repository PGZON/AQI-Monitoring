/**
 * Optimized Image Component with Lazy Loading
 * Provides WebP support, lazy loading, and responsive images
 */

import React, { useState, useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

/**
 * OptimizedImage Component
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = null,
  quality = 75,
  sizes = '100vw',
  priority = false,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : null);
  const imgRef = useRef();
  
  const { ref: intersectionRef, hasBeenInView } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });

  // Generate WebP and fallback sources
  const generateSources = (originalSrc) => {
    if (!originalSrc) return [];
    
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return [
      { srcSet: webpSrc, type: 'image/webp' },
      { srcSet: originalSrc, type: 'image/jpeg' }
    ];
  };

  // Set image source when in view or priority
  React.useEffect(() => {
    if ((hasBeenInView || priority) && !imageSrc) {
      setImageSrc(src);
    }
  }, [hasBeenInView, priority, src, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  const sources = generateSources(imageSrc);

  return (
    <div 
      ref={intersectionRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder || (
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {imageSrc && (
        <picture>
          {sources.map((source, index) => (
            <source key={index} {...source} />
          ))}
          <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            {...props}
          />
        </picture>
      )}
    </div>
  );
};

/**
 * Responsive Image Component
 */
export const ResponsiveImage = ({ 
  src, 
  alt, 
  aspectRatio = '16/9',
  className = '',
  sizes = {
    sm: '100vw',
    md: '50vw',
    lg: '33vw'
  },
  ...props 
}) => {
  const aspectRatioClass = {
    '16/9': 'aspect-w-16 aspect-h-9',
    '4/3': 'aspect-w-4 aspect-h-3',
    '1/1': 'aspect-w-1 aspect-h-1',
    '3/2': 'aspect-w-3 aspect-h-2'
  }[aspectRatio] || 'aspect-w-16 aspect-h-9';

  const responsiveSizes = typeof sizes === 'object' 
    ? Object.entries(sizes)
        .map(([breakpoint, size]) => `(min-width: ${breakpoint === 'sm' ? '640px' : breakpoint === 'md' ? '768px' : '1024px'}) ${size}`)
        .join(', ') + ', 100vw'
    : sizes;

  return (
    <div className={`${aspectRatioClass} ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        sizes={responsiveSizes}
        className="w-full h-full object-cover"
        {...props}
      />
    </div>
  );
};

/**
 * Avatar Image Component
 */
export const AvatarImage = ({ 
  src, 
  alt, 
  size = 'md',
  fallback = null,
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  const fallbackElement = fallback || (
    <div className={`${sizeClasses} bg-gray-300 rounded-full flex items-center justify-center`}>
      <svg className="w-1/2 h-1/2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses} rounded-full object-cover ${className}`}
      placeholder={fallbackElement}
      priority={size === 'xs' || size === 'sm'} // Small avatars are usually above fold
      {...props}
    />
  );
};

/**
 * Icon Image Component for small graphics
 */
export const IconImage = ({ 
  src, 
  alt, 
  size = 24,
  className = '',
  ...props 
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      priority={true} // Icons are usually critical
      {...props}
    />
  );
};

export default OptimizedImage;
