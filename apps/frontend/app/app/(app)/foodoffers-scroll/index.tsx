import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, Text, View, TouchableOpacity } from 'react-native';
import {
  Ionicons,
  FontAwesome6,
  Entypo,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { format } from 'date-fns';
import { useNavigation, router } from 'expo-router';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CanteenFeedbackLabelHelper } from '@/redux/actions/CanteenFeedbacksLabel/CanteenFeedbacksLabel';
import { SET_CANTEEN_FEEDBACK_LABELS, SET_SELECTED_DATE } from '@/redux/Types/types';
import FoodOffersScrollList from '@/components/FoodOffersScrollList';
import styles from './styles';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';

const FoodOffersScroll = () => {
  useSetPageTitle('FoodOffersScroll');
  const { translate } = useLanguage();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const selectedCanteen = useSelectedCanteen();
  const { selectedDate } = useSelector((state: RootState) => state.food);
  const { canteenFeedbackLabels } = useSelector(
    (state: RootState) => state.canteenReducer,
  );
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const fetchCanteenLabels = useCallback(async () => {
    try {
      const helper = new CanteenFeedbackLabelHelper();
      const labels = await helper.fetchCanteenFeedbackLabels();
      dispatch({ type: SET_CANTEEN_FEEDBACK_LABELS, payload: labels });
    } catch (e) {
      console.error('Error fetching Canteen Feedback Labels:', e);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!canteenFeedbackLabels || canteenFeedbackLabels.length === 0) {
      fetchCanteenLabels();
    }
  }, [fetchCanteenLabels]);

  const getDayLabel = (date: string) => {
    const currentDate = new Date();
    const day = new Date(date);

    currentDate.setHours(0, 0, 0, 0);
    day.setHours(0, 0, 0, 0);

    if (currentDate.toDateString() === day.toDateString()) {
      return 'today';
    }

    currentDate.setDate(currentDate.getDate() - 1);
    if (currentDate.toDateString() === day.toDateString()) {
      return 'yesterday';
    }

    currentDate.setDate(currentDate.getDate() + 2);
    if (currentDate.toDateString() === day.toDateString()) {
      return 'tomorrow';
    }

    return format(day, 'dd.MM.yyyy');
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    dispatch({
      type: SET_SELECTED_DATE,
      payload: currentDate.toISOString().split('T')[0],
    });
  };

  const listHeader = (
    <View style={[styles.header, { backgroundColor: theme.header.background }]}>
      <View style={styles.row}>
        <View style={styles.col1}>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
            <Ionicons name="menu" size={24} color={theme.header.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ ...styles.heading, color: theme.header.text }}>
              {selectedCanteen?.alias || translate(TranslationKeys.food_offers)}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ ...styles.col2, gap: 10 }}>
          <TouchableOpacity onPress={() => router.navigate('/price-group')}>
            <FontAwesome6 name="euro-sign" size={24} color={theme.header.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ ...styles.col2, gap: 10 }}>
          <TouchableOpacity onPress={() => handleDateChange('prev')}>
            <Entypo name="chevron-left" size={24} color={theme.header.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialIcons name="calendar-month" size={24} color={theme.header.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDateChange('next')}>
            <Entypo name="chevron-right" size={24} color={theme.header.text} />
          </TouchableOpacity>
          <Text style={{ ...styles.heading, color: theme.header.text }}>
            {selectedDate ? translate(getDayLabel(selectedDate)) : ''}
          </Text>
        </View>
        <View style={{ ...styles.col2, gap: 10 }}>
          <TouchableOpacity>
            <FontAwesome6 name="people-group" size={24} color={theme.header.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="clock-time-eight" size={24} color={theme.header.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.iconBg }}>
      {listHeader}
      {selectedCanteen && (
        <FoodOffersScrollList
          canteenId={selectedCanteen.id}
          startDate={selectedDate}
        />
      )}
    </SafeAreaView>
  );
};

export default FoodOffersScroll;
