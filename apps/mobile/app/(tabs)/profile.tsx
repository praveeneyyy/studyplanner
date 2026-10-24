import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileApi } from '../../src/lib/api';
import { colorTokens } from '@ai-study/design-tokens';
import * as SecureStore from 'expo-secure-store';
import { Award, CheckCircle2, Lock, LogOut } from 'lucide-react-native';

export default function MobileProfile() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  const colors = colorTokens.light;

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, achRes] = await Promise.all([
          mobileApi.getRewardsSummary(),
          mobileApi.getAchievements()
        ]);
        if (sumRes?.data) setSummary(sumRes.data);
        if (achRes?.data) setAchievements(achRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Rewards & Progress</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Level Card */}
        <View style={[styles.levelCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.levelBadge, { backgroundColor: colors.accentSubtle, borderColor: colors.accentBase }]}>
            <Text style={[styles.levelNum, { color: colors.accentBase }]}>L{summary?.currentLevel || 1}</Text>
          </View>
          <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>
            {summary?.levelTitle || 'Consistent Scholar'}
          </Text>
          <Text style={[styles.xpText, { color: colors.textMuted }]}>
            {summary?.totalXP || 0} Total XP Verified
          </Text>
        </View>

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements</Text>
        <View style={styles.achievementsList}>
          {achievements.map((ach) => (
            <View
              key={ach.id}
              style={[
                styles.achCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
                !ach.isUnlocked && { opacity: 0.5 }
              ]}
            >
              <View style={styles.achHeader}>
                <Text style={[styles.achTitle, { color: colors.textPrimary }]}>{ach.title}</Text>
                {ach.isUnlocked ? (
                  <CheckCircle2 size={16} color="#1E7E34" />
                ) : (
                  <Lock size={14} color="#63686D" />
                )}
              </View>
              <Text style={[styles.achDesc, { color: colors.textMuted }]}>{ach.description}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} color="#B3261E" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 16, paddingTop: 4 },
  levelCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  levelNum: { fontSize: 18, fontWeight: 'bold' },
  levelTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  xpText: { fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  achievementsList: { gap: 8, marginBottom: 24 },
  achCard: { padding: 12, borderRadius: 10, borderWidth: 1 },
  achHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  achTitle: { fontSize: 12, fontWeight: 'bold' },
  achDesc: { fontSize: 11, marginTop: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12
  },
  logoutText: { color: '#B3261E', fontSize: 13, fontWeight: '600' }
});
