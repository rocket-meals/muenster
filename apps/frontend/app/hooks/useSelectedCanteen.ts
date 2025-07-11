import { useGlobalSearchParams } from 'expo-router';
import useKioskMode from './useKioskMode';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/redux/reducer';

export default function useSelectedCanteen() {
  const kioskMode = useKioskMode();
  const { canteens_id } = useGlobalSearchParams<{ canteens_id?: string }>();
  const { canteens, selectedCanteen } = useSelector(
    (state: RootState) => state.canteenReducer,
  );

  return useMemo(() => {
    if (kioskMode) {
      if (canteens_id) {
        const found = canteens.find(
          (c) => String(c.id) === String(canteens_id),
        );
        if (found) {
          return found;
        }
      }
      if (selectedCanteen) {
        return selectedCanteen;
      }
    }
    return selectedCanteen;
  }, [kioskMode, canteens_id, canteens, selectedCanteen]);
}
