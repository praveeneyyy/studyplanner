import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileApi } from '../../src/lib/api';
import { colorTokens } from '@ai-study/design-tokens';
import * as Haptics from 'expo-haptics';
import { Play, Pause, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export default function MobileSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);

  const colors = colorTokens.light;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await mobileApi.getSessions();
        const found = res?.data?.find((s: any) => s.id === id);
        if (found) {
          setSession(found);
          setSecondsRemaining((found.durationMinutes || 45) * 60);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const toggleTimer = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (!isRunning && session?.status === 'PLANNED') {
      mobileApi.startSession(session.id).catch(() => {});
    }
    setIsRunning(!isRunning);
  };

  const handleFinish = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setIsRunning(false);
    const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      const res = await mobileApi.completeSession(session.id, {
        actualDurationMinutes: actualMinutes,
        reflectionScore: 4
      });
      setRewardData(res.data?.reward);
      setFinished(true);
    } catch (err: any) {
      Alert.alert('Completion Note', err.message || 'Saved session');
      setFinished(true);
    }
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {session?.topic?.title || 'Study Session'}
        </Text>
      </View>

      {!finished ? (
        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color: colors.accentBase }]}>
            {session?.topic?.unit?.subject?.name} • {session?.sessionType || 'LEARN'}
          </Text>

          {/* Large Tabular Numeral Clock */}
          <Text style={[styles.timerText, { color: colors.textPrimary }]}>{timeFormatted}</Text>
          <Text style={[styles.elapsedText, { color: colors.textMuted }]}>
            Elapsed: {Math.floor(elapsedSeconds / 60)}m
          </Text>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={toggleTimer}
              style={[
                styles.actionBtn,
                { backgroundColor: isRunning ? '#B45309' : colors.accentBase }
              ]}
            >
              {isRunning ? <Pause size={18} color="#FFFFFF" /> : <Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
              <Text style={styles.actionBtnText}>{isRunning ? 'Pause' : 'Start Focus'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
              <Text style={[styles.finishBtnText, { color: colors.accentBase }]}>Complete & Earn XP</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.celebration}>
          <CheckCircle2 size={48} color="#1E7E34" />
          <Text style={[styles.celebTitle, { color: colors.textPrimary }]}>Session Completed!</Text>
          <Text style={[styles.celebSub, { color: colors.textMuted }]}>
            +{rewardData?.xpAwarded || 25} XP recorded to your verified ledger.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={[styles.returnBtn, { backgroundColor: colors.accentBase }]}
          >
            <Text style={styles.returnBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  eyebrow: { fontSize: 12, fontWeight: 'bold', marginBottom: 12 },
  timerText: { fontSize: 72, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: -2 },
  elapsedText: { fontSize: 12, marginTop: 8, marginBottom: 40 },
  controls: { width: '100%', gap: 14, alignItems: 'center' },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  finishBtn: { padding: 10 },
  finishBtnText: { fontSize: 12, fontWeight: '600' },
  celebration: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  celebTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  celebSub: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  returnBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  returnBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }
});
