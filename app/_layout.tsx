import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initDatabase } from '../src/db/database';
import { SettingsProvider, useColors, useSettings } from '../src/context/SettingsContext';

function RootNav() {
  const colors = useColors();
  const { settings } = useSettings();

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.header },
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match', presentation: 'card' }} />
        <Stack.Screen name="match/edit/[id]" options={{ title: 'Edit match', presentation: 'card' }} />
        <Stack.Screen name="live" options={{ title: 'Live', headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <RootNav />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
});
