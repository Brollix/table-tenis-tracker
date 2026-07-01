import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStats } from '../../src/db/matches';
import { PlayerStats } from '../../src/types';
import { Colors } from '../../src/theme';
import { useColors } from '../../src/context/SettingsContext';

const medals = ['🥇', '🥈', '🥉'];

export default function StatsScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [stats, setStats] = useState<PlayerStats[]>([]);

  useFocusEffect(useCallback(() => {
    getStats().then(setStats);
  }, []));

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      data={stats}
      keyExtractor={(s) => String(s.id)}
      contentContainerStyle={stats.length === 0 ? styles.emptyContainer : styles.list}
      ListHeaderComponent={
        stats.length > 0 ? (
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.rankCell]}>#</Text>
            <Text style={[styles.headerCell, styles.nameCell]}>Jugador</Text>
            <Text style={[styles.headerCell, styles.statCell]}>PJ</Text>
            <Text style={[styles.headerCell, styles.statCell]}>PG</Text>
            <Text style={[styles.headerCell, styles.pctCell]}>Win %</Text>
          </View>
        ) : null
      }
      renderItem={({ item, index }) => {
        const medal = index < 3 && item.matchTotal > 0 ? medals[index] : null;
        return (
          <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
            <Text style={[styles.cell, styles.rankCell]}>{medal ?? (index + 1)}</Text>
            <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.matchTotal}</Text>
            <Text style={[styles.cell, styles.statCell, styles.wins]}>{item.matchWins}</Text>
            <Text style={[styles.cell, styles.pctCell, styles.pctValue]}>
              {item.matchTotal > 0 ? `${item.matchPct}%` : '—'}
            </Text>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>Agregá jugadores y jugá partidos para ver el ranking</Text>
        </View>
      }
    />
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  list: { paddingBottom: 20 },
  emptyContainer: { flexGrow: 1 },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: c.cardAlt,
    borderBottomWidth: 1,
    borderBottomColor: c.borderStrong,
  },
  headerCell: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: c.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  rowAlt: { backgroundColor: c.cardAlt },
  cell: { fontSize: 15, color: c.text, textAlign: 'center' },
  rankCell: { width: 30, fontSize: 18, textAlign: 'left' },
  nameCell: { flex: 1, textAlign: 'left', fontWeight: '600' },
  statCell: { width: 44, fontWeight: '700' },
  wins: { color: c.success },
  pctCell: { width: 56 },
  pctValue: { fontWeight: '700', color: c.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: c.textFaint, textAlign: 'center', lineHeight: 20 },
});
