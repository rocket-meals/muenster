import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';


export default function FoodOfferLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.header.background },
        headerTintColor: theme.header.text,
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: 'Food Offers',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
