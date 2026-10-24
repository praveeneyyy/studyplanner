import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileApi } from '../../src/lib/api';
import { colorTokens } from '@ai-study/design-tokens';
import { Play, Clock, Flame, Calendar, Repeat, Award } from 'lucide-react-native';

export default function MobileDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const colors = colorTokens.light;

  useEffect(() => {
    async function load() {
      try {
        const res = await mobileApi.getDashboardAnalytics();
        if (res?.data) setMetrics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bgApp }]}>
        <ActivityIndicator color={colors.accentBase} />
      </View>
    );
  }

  const nextSession = metrics?.todaysSessions?.find((s: any) => s.status === 'PLANNED' || s.status === 'IN_PROGRESS');
  const nearestExam = metrics?.upcomingExams?.[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>Academic Dashboard</Text>
            <Text style={[styles.subGreeting, { color: colors.textMuted }]}>
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: '#FFF8E6', borderColor: '#B57700' }]}>
            <Flame size={14} color="#B57700" />
            <Text style={styles.streakText}>Active Streak</Text>
          </View>
        </View>

        {/* Nearest Exam Countdown */}
        {nearestExam && (
          <View style={styles.examBanner}>
            <View style={styles.examBadge}>
              <Text style={styles.examDays}>{nearestExam.daysLeft}d</Text>
            </View>
            <View style={styles.examInfo}>
              <Text style={styles.examTitle}>{nearestExam.title}</Text>
              <Text style={styles.examSubtitle}>{nearestExam.subjectName} • Exam Approaching</Text>
            </View>
          </View>
        )}

        {/* Primary Action Card: What to Study Next */}
        <View style={[styles.heroCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.eyebrow, { color: colors.accentBase }]}>WHAT SHOULD I STUDY NEXT?</Text>
          <Text style={[styles.topicTitle, { color: colors.textPrimary }]}>
            {nextSession ? nextSession.topic?.title : 'All Daily Sessions Completed!'}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {nextSession
              ? `${nextSession.topic?.unit?.subject?.name} • ${nextSession.durationMinutes} min focus block`
              : 'Great job maintaining your study discipline today.'}
          </Text>

          {nextSession && (
            <TouchableOpacity
              onPress={() => router.push(`/session/${nextSession.id}`)}
              style={[styles.startBtn, { backgroundColor: colors.accentBase }]}
            >
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startBtnText}>Begin Study Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2-Column Daily Progress Cards */}
        <View style={styles.grid}>
          <View style={[styles.metricCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Daily Target</Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {metrics?.completedTodayMinutes || 0}m
            </Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>
              / {metrics?.dailyTargetMinutes || 120} min goal
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Due Reviews</Text>
            <Text style={[styles.metricVal, { color: colors.accentBase }]}>
              {metrics?.dueRevisionsCount || 0}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>flashcards due today</Text>
          </View>
        </View>

        {/* Quick Link to Today's Agenda */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/plan')}
          style={[styles.agendaLink, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
        >
          <Calendar size={16} color={colors.accentBase} />
          <Text style={[styles.agendaLinkText, { color: colors.textPrimary }]}>View Full Daily Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  greeting: { fontSize: 18, fontWeight: 'bold' },
  subGreeting: { fontSize: 12, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  streakText: { fontSize: 10, fontWeight: '600', color: '#B57700' },
  examBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#FFE08A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  examBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#B57700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  examDays: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  examInfo: { flex: 1 },
  examTitle: { fontSize: 12, fontWeight: 'bold', color: '#191C1D' },
  examSubtitle: { fontSize: 10, color: '#63686D' },
  heroCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  eyebrow: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
  topicTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  metaText: { fontSize: 12, marginBottom: 16 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 8
  },
  startBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  metricLabel: { fontSize: 11, fontWeight: '500' },
  metricVal: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  metricSub: { fontSize: 10, marginTop: 2 },
  agendaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  agendaLinkText: { fontSize: 12, fontWeight: '600' }
});
