import React from 'react';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import VerticalScrollTopFood from '@/components/VerticalScrollTopFood';

const VerticalScrollTopFoodScreen = () => {
  useSetPageTitle(TranslationKeys.vertical_scroll_top_food);
  return <VerticalScrollTopFood />;
};

export default VerticalScrollTopFoodScreen;
