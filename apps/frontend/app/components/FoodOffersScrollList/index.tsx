import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { addDays, format } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { fetchFoodOffersByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { DatabaseTypes } from 'repo-depkit-common';
import FoodItem from '@/components/FoodItem/FoodItem';
import CanteenFeedbackLabels from '@/components/CanteenFeedbackLabels/CanteenFeedbackLabels';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import styles from './styles';

interface FoodOffersScrollListProps {
  canteenId: string;
  startDate: string;
}

interface DayData {
  date: string;
  offers: DatabaseTypes.Foodoffers[];
}

const FoodOffersScrollList: React.FC<FoodOffersScrollListProps> = ({
  canteenId,
  startDate,
}) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { canteenFeedbackLabels, canteens } = useSelector(
    (state: RootState) => state.canteenReducer,
  );
  const selectedCanteen = canteens?.find((c) => c.id === canteenId) as
    | DatabaseTypes.Canteens
    | undefined;
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  const loadDay = useCallback(
    async (date: string) => {
      try {
        const res = await fetchFoodOffersByCanteen(canteenId, date);
        const offers = res?.data || [];
        return { date, offers } as DayData;
      } catch (e) {
        console.error('Error loading food offers', e);
        return { date, offers: [] } as DayData;
      }
    },
    [canteenId],
  );

  const init = useCallback(async () => {
    setLoading(true);
    const baseDate = new Date(startDate);
    const toLoad = [0, 1, 2];
    const loaded: DayData[] = [];
    for (const offset of toLoad) {
      const d = addDays(baseDate, offset).toISOString().split('T')[0];
      loaded.push(await loadDay(d));
    }
    setDays(loaded);
    setLoading(false);
  }, [startDate, loadDay]);

  useEffect(() => {
    init();
  }, [init]);

  const loadNext = async () => {
    const lastDate = days[days.length - 1].date;
    const nextDate = addDays(new Date(lastDate), 1).toISOString().split('T')[0];
    const nextDay = await loadDay(nextDate);
    setDays((prev) => [...prev, nextDay]);
  };

  const onEndReached = () => {
    loadNext();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  const renderDay = ({ item }: { item: DayData }) => {
    const feedbacks = canteenFeedbackLabels?.map((label, idx) => (
      <CanteenFeedbackLabels key={`fl-${idx}`} label={label} date={item.date} />
    ));

    return (
      <View style={styles.dayContainer}>
        <Text style={[styles.dateHeader, { color: theme.screen.text }]}> {format(new Date(item.date), 'dd.MM.yyyy')} </Text>
        <View
          style={{
            ...styles.foodContainer,
            gap: screenWidth > 550 ? 10 : 10,
            justifyContent: 'center',
          }}
        >
          {item.offers.map((offer) => (
            <FoodItem
              key={offer.id}
              item={offer}
              canteen={selectedCanteen as DatabaseTypes.Canteens}
              handleMenuSheet={() => {}}
              handleImageSheet={() => {}}
              handleEatingHabitsSheet={() => {}}
              setSelectedFoodId={() => {}}
            />
          ))}
          {item.offers.length === 0 && (
            <Text style={{ color: theme.screen.text }}>
              {translate(TranslationKeys.no_foodoffers_found_for_selection)}
            </Text>
          )}
        </View>
        {feedbacks && feedbacks.length > 0 && (
          <View style={styles.feebackContainer}>{feedbacks}</View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.screen.background }]}> 
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={days}
      keyExtractor={(item) => item.date}
      renderItem={renderDay}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
      contentContainerStyle={{ backgroundColor: theme.screen.background }}
    />
  );
};

export default FoodOffersScrollList;
