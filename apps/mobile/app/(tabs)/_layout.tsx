import React from 'react';
import { Tabs } from 'expo-router';
import { colorTokens } from '@ai-study/design-tokens';
import { LayoutDashboard, Calendar, Sparkles, BookOpen, Award } from 'lucide-react-native';

export default function TabLayout() {
  const colors = colorTokens.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentBase,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderSubtle,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={20} />
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={20} />
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Tutor',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={20} />
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={20} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => <Award color={color} size={20} />
        }}
      />
    </Tabs>
  );
}
