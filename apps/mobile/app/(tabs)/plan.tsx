import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileApi } from '../../src/lib/api';
import { colorTokens } from '@ai-study/design-tokens';
import { Play, CheckCircle2, RotateCcw, Calendar } from 'lucide-react-native';

export default function MobilePlan() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = colorTokens.light;

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const res = await mobileApi.getSessions();
      if (res?.data) setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleRecover = async () => {
    try {
      await mobileApi.recoverMissedSessions();
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Study Plan</Text>
        <TouchableOpacity onPress={handleRecover} style={styles.recoverBtn}>
          <RotateCcw size={12} color={colors.accentBase} />
          <Text style={[styles.recoverText, { color: colors.accentBase }]}>Recover Missed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.accentBase} style={{ marginTop: 40 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.empty}>
            <Calendar size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No study sessions scheduled.</Text>
          </View>
        ) : (
          sessions.map((item) => {
            const isDone = item.status === 'COMPLETED';
            const startTime = new Date(item.scheduledStart).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
                  isDone && { opacity: 0.6 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>{startTime}</Text>
                  <Text style={[styles.typeText, { color: colors.accentBase }]}>{item.sessionType}</Text>
                </View>

                <Text style={[styles.topicTitle, { color: colors.textPrimary }, isDone && styles.strikethrough]}>
                  {item.topic?.title}
                </Text>
                <Text style={[styles.subjectName, { color: colors.textMuted }]}>
                  {item.topic?.unit?.subject?.name} • {item.durationMinutes}m block
                </Text>

                <View style={styles.cardFooter}>
                  {isDone ? (
                    <View style={styles.completedTag}>
                      <CheckCircle2 size={13} color="#1E7E34" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => router.push(`/session/${item.id}`)}
                      style={[styles.startBtn, { backgroundColor: colors.accentBase }]}
                    >
                      <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.startBtnText}>Start</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  recoverBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recoverText: { fontSize: 11, fontWeight: '600' },
  scroll: { padding: 16, paddingTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyText: { fontSize: 12 },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  timeText: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
  typeText: { fontSize: 10, fontWeight: 'bold' },
  topicTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  strikethrough: { textDecorationLine: 'line-through' },
  subjectName: { fontSize: 11, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  completedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { fontSize: 11, color: '#1E7E34', fontWeight: '600' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6
  },
  startBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }
});
