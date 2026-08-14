import { useState, useEffect } from 'react';

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isLaptop = windowWidth >= 1024 && windowWidth < 1280;
  const isDesktop = windowWidth >= 1280;

  return {
    windowWidth,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop
  };
}
