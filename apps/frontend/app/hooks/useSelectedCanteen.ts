import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGlobalSearchParams } from 'expo-router';
import { CanteenHelper } from '@/redux/actions/Canteens/Canteens';
import { SET_CANTEENS, SET_SELECTED_CANTEEN } from '@/redux/Types/types';
import { RootState } from '@/redux/reducer';
import { DatabaseTypes } from 'repo-depkit-common';

/**
 * Hook to determine the currently selected canteen.
 * Priority order:
 *   1. `canteen_id` param from URL
 *   2. kioskMode -> first public canteen
 *   3. canteen stored in profile
 */
const useSelectedCanteen = () => {
  const { canteen_id, kioskMode } = useGlobalSearchParams();
  const dispatch = useDispatch();
  const { canteens, selectedCanteen } = useSelector(
    (state: RootState) => state.canteenReducer
  );
  const { profile } = useSelector((state: RootState) => state.authReducer);

  useEffect(() => {
    const selectCanteen = async () => {
      try {
        // 1. Param canteen_id has highest priority
        if (canteen_id) {
          if (!selectedCanteen || selectedCanteen.id !== canteen_id) {
            const helper = new CanteenHelper();
            const canteen = (await helper.fetchCanteenById(
              String(canteen_id)
            )) as DatabaseTypes.Canteens;
            if (canteen) {
              dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
            }
          }
          return;
        }

        // 2. Kiosk mode -> select first public canteen
        if (kioskMode === 'true') {
          if (!selectedCanteen) {
            const helper = new CanteenHelper();
            const all = (await helper.fetchCanteens({})) as DatabaseTypes.Canteens[];
            const published = all.filter((c) => c.status === 'published');
            if (published.length > 0) {
              dispatch({ type: SET_CANTEENS, payload: published });
              dispatch({ type: SET_SELECTED_CANTEEN, payload: published[0] });
            }
          }
          return;
        }

        // 3. Canteen stored in profile
        if (profile?.canteen) {
          if (!selectedCanteen || selectedCanteen.id !== profile.canteen) {
            const helper = new CanteenHelper();
            const canteen = (await helper.fetchCanteenById(
              String(profile.canteen)
            )) as DatabaseTypes.Canteens;
            if (canteen) {
              dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
            }
          }
        }
      } catch (error) {
        console.error('Error determining selected canteen:', error);
      }
    };

    selectCanteen();
  }, [canteen_id, kioskMode, profile?.canteen]);

  return useSelector((state: RootState) => state.canteenReducer.selectedCanteen);
};

export default useSelectedCanteen;
