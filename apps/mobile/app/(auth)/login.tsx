import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApi } from '../../src/lib/api';
import * as SecureStore from 'expo-secure-store';
import { colorTokens } from '@ai-study/design-tokens';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('alex@university.edu');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = colorTokens.light;

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await mobileApi.login({ email, password });
      if (res?.data?.token) {
        await SecureStore.setItemAsync('auth_token', res.data.token);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: colors.accentBase }]}>
          <Text style={styles.iconText}>SP</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>AI Smart Study Planner</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sign in to synchronize your mobile study workspace
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.borderStrong }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.borderStrong }]}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={[styles.button, { backgroundColor: colors.accentBase }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8E7E1'
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16
  },
  iconText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14
  },
  button: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },
  errorText: {
    color: '#B3261E',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10
  }
});
