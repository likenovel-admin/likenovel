import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { addToNavigationHistory } from '@/utils/navigationHistory';

/**
 * Hook to automatically track navigation history
 */
export const useNavigationHistory = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      addToNavigationHistory(pathname);
    }
  }, [pathname]);
};
