/**
 * Intersection Observer Hook
 * Lazy loads components when they come into viewport
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect when element enters viewport
 */
export const useIntersectionObserver = (options = {}) => {
  const [inView, setInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '50px',
      triggerOnce: true,
      ...options
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);
        
        if (isIntersecting && !hasBeenInView) {
          setHasBeenInView(true);
          if (defaultOptions.triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      defaultOptions
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasBeenInView, options]);

  return { ref, inView, hasBeenInView };
};

/**
 * Lazy Load Wrapper Component
 */
export const LazyLoadWrapper = ({ 
  children, 
  fallback, 
  height = '400px', 
  className = '',
  options = {} 
}) => {
  const { ref, hasBeenInView } = useIntersectionObserver(options);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ minHeight: height }}
    >
      {hasBeenInView ? children : (fallback || (
        <div 
          className="bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2 animate-pulse"></div>
            <p className="text-gray-500 text-sm">Content will load when visible</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default useIntersectionObserver;
