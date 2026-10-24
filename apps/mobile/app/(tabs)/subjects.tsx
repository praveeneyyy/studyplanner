import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileApi } from '../../src/lib/api';
import { colorTokens } from '@ai-study/design-tokens';
import { BookOpen, Layers } from 'lucide-react-native';

export default function MobileSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = colorTokens.light;

  useEffect(() => {
    async function load() {
      try {
        const res = await mobileApi.getSubjects();
        if (res?.data) setSubjects(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Curriculum & Subjects</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.accentBase} style={{ marginTop: 40 }} />
        ) : (
          subjects.map((sub) => (
            <View
              key={sub.id}
              style={[styles.subjectCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
            >
              <View style={styles.subjectHeader}>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectTitle, { color: colors.textPrimary }]}>{sub.name}</Text>
                  <Text style={[styles.subjectMeta, { color: colors.textMuted }]}>
                    {sub.code || 'Course'} • Priority {sub.priority}/5
                  </Text>
                </View>
              </View>

              <View style={styles.unitsList}>
                {(sub.units || []).map((u: any) => (
                  <View key={u.id} style={[styles.unitItem, { backgroundColor: colors.bgElevated }]}>
                    <Text style={[styles.unitTitle, { color: colors.textPrimary }]}>{u.title}</Text>
                    <Text style={[styles.topicsCount, { color: colors.textMuted }]}>
                      {u.topics?.length || 0} topics
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 16, paddingTop: 4 },
  subjectCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14
  },
  subjectHeader: { marginBottom: 12 },
  subjectInfo: { flex: 1 },
  subjectTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  subjectMeta: { fontSize: 11 },
  unitsList: { gap: 8 },
  unitItem: {
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  unitTitle: { fontSize: 12, fontWeight: '600', flex: 1 },
  topicsCount: { fontSize: 10, fontWeight: 'bold' }
});
