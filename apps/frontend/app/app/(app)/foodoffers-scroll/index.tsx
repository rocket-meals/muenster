import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Text, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { fetchFoodOffersByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { DatabaseTypes } from 'repo-depkit-common';
import { addDays, subDays, format } from 'date-fns';
import FoodItem from '@/components/FoodItem/FoodItem';
import styles from './styles';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';

interface DayData {
  date: string;
  offers: DatabaseTypes.Foodoffers[];
}

const FoodOffersScroll = () => {
  useSetPageTitle('FoodOffersScroll');
  const { translate } = useLanguage();
  const { theme } = useTheme();
  const selectedCanteen = useSelectedCanteen();
  const { selectedDate } = useSelector((state: RootState) => state.food);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDay = useCallback(async (date: string) => {
    const canteenId = selectedCanteen?.id as string;
    try {
      const res = await fetchFoodOffersByCanteen(canteenId, date);
      const offers = res?.data || [];
      return { date, offers } as DayData;
    } catch (e) {
      console.error('Error loading food offers', e);
      return { date, offers: [] } as DayData;
    }
  }, [selectedCanteen]);

  const init = useCallback(async () => {
    setLoading(true);
    const baseDate = new Date(selectedDate);
    const toLoad = [0, 1, 2];
    const loaded: DayData[] = [];
    for (const offset of toLoad) {
      const d = addDays(baseDate, offset).toISOString().split('T')[0];
      loaded.push(await loadDay(d));
    }
    setDays(loaded);
    setLoading(false);
  }, [selectedDate, loadDay]);

  useEffect(() => {
    init();
  }, [init]);

  const loadNext = async () => {
    const lastDate = days[days.length - 1].date;
    const nextDate = addDays(new Date(lastDate), 1).toISOString().split('T')[0];
    const nextDay = await loadDay(nextDate);
    setDays((prev) => [...prev, nextDay]);
  };

  const loadPrev = async () => {
    const firstDate = days[0].date;
    const prevDate = subDays(new Date(firstDate), 1).toISOString().split('T')[0];
    const prevDay = await loadDay(prevDate);
    setDays((prev) => [prevDay, ...prev]);
  };

  const onEndReached = () => {
    loadNext();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrev();
    setRefreshing(false);
  };

  const renderDay = ({ item }: { item: DayData }) => (
    <View style={styles.dayContainer}>
      <Text style={[styles.dateHeader, { color: theme.screen.text }]}> {format(new Date(item.date), 'dd.MM.yyyy')} </Text>
      {item.offers.map((offer) => (
        <FoodItem
          key={offer.id}
          item={offer}
          canteen={selectedCanteen}
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
  );

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
      contentContainerStyle={{ backgroundColor: theme.screen.background }}
    />
  );
};

export default FoodOffersScroll;
