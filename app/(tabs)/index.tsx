import { useCallback, useMemo, useState } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getMatches } from '../../src/db/matches';
import { Match } from '../../src/types';
import MatchCard from '../../src/components/MatchCard';
import { Colors } from '../../src/theme';
import { useColors } from '../../src/context/SettingsContext';

export default function HistorialScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getMatches();
    setMatches(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      data={matches}
      keyExtractor={(m) => String(m.id)}
      renderItem={({ item }) => (
        <MatchCard match={item} onPress={() => router.push(`/match/${item.id}`)} />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
      }
      contentContainerStyle={matches.length === 0 ? styles.emptyContainer : styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏓</Text>
          <Text style={styles.emptyText}>No hay partidos registrados</Text>
          <Text style={styles.emptyHint}>Tocá "Nuevo" para agregar el primero</Text>
        </View>
      }
    />
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  list: { paddingVertical: 8 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: c.text },
  emptyHint: { fontSize: 13, color: c.textFaint },
});
