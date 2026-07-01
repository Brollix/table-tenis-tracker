import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { getMatch, deleteMatch } from '../../src/db/matches';
import { Match } from '../../src/types';
import { setsWon } from '../../src/lib/match';
import { Colors } from '../../src/theme';
import { useColors } from '../../src/context/SettingsContext';

function teamLabel(match: Match, team: 1 | 2): string {
  if (team === 1) {
    return match.mode === 'doubles'
      ? `${match.team1_player1_name} & ${match.team1_player2_name}`
      : (match.team1_player1_name ?? '');
  }
  return match.mode === 'doubles'
    ? `${match.team2_player1_name} & ${match.team2_player2_name}`
    : (match.team2_player1_name ?? '');
}

function formatDateTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function MatchDetailScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);

  useFocusEffect(useCallback(() => {
    getMatch(Number(id)).then(setMatch);
  }, [id]));

  const handleDelete = () => {
    Alert.alert('Eliminar partido', '¿Seguro que querés eliminar este partido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await deleteMatch(Number(id));
          router.back();
        },
      },
    ]);
  };

  if (!match) return <View style={styles.container} />;

  const t1Won = match.winner_team === 1;
  const won = setsWon(match.sets);
  const t1 = teamLabel(match, 1);
  const t2 = teamLabel(match, 2);
  const winnerName = t1Won ? t1 : t2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Ionicons name="trophy" size={28} color={c.success} />
        <Text style={styles.winnerLabel}>Ganador</Text>
        <Text style={styles.winnerName}>{winnerName}</Text>
        <Text style={styles.bannerScore}>{won.team1} - {won.team2}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaPill}>{match.mode === 'singles' ? 'Singles' : 'Dobles'}</Text>
        <Text style={styles.metaDate}>{formatDateTime(match.played_at)}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.rowHead]}>
          <Text style={[styles.cell, styles.nameCell, styles.headText]}>Jugador</Text>
          {match.sets.map((s) => (
            <Text key={s.set_number} style={[styles.cell, styles.headText]}>S{s.set_number}</Text>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={[styles.cell, styles.nameCell, t1Won && styles.bold]} numberOfLines={1}>{t1}</Text>
          {match.sets.map((s) => (
            <Text key={s.set_number} style={[styles.cell, s.team1_score > s.team2_score && styles.cellWin]}>
              {s.team1_score}
            </Text>
          ))}
        </View>

        <View style={[styles.row, styles.rowLast]}>
          <Text style={[styles.cell, styles.nameCell, !t1Won && styles.bold]} numberOfLines={1}>{t2}</Text>
          {match.sets.map((s) => (
            <Text key={s.set_number} style={[styles.cell, s.team2_score > s.team1_score && styles.cellWin]}>
              {s.team2_score}
            </Text>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/match/edit/${id}`)}>
        <Ionicons name="create-outline" size={18} color={c.onPrimary} />
        <Text style={styles.editText}>Editar partido</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={c.danger} />
        <Text style={styles.deleteText}>Eliminar partido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16 },
  banner: {
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  winnerLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  winnerName: { fontSize: 22, fontWeight: '800', color: c.text, textAlign: 'center' },
  bannerScore: { fontSize: 40, fontWeight: '900', color: c.success, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
  metaPill: {
    fontSize: 11, fontWeight: '700', color: c.primary, backgroundColor: c.primaryMuted,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5, overflow: 'hidden',
  },
  metaDate: { fontSize: 12, color: c.textMuted },
  table: { backgroundColor: c.card, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  rowHead: { backgroundColor: c.cardAlt },
  rowLast: { borderBottomWidth: 0 },
  cell: { width: 36, textAlign: 'center', fontSize: 16, color: c.text },
  nameCell: { flex: 1, textAlign: 'left', fontSize: 15, color: c.textMuted },
  bold: { fontWeight: '800', color: c.text },
  cellWin: { fontWeight: '800', color: c.success },
  headText: { fontSize: 11, fontWeight: '700', color: c.textFaint, textTransform: 'uppercase' },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, marginTop: 20, backgroundColor: c.primary, borderRadius: 14 },
  editText: { fontSize: 15, fontWeight: '700', color: c.onPrimary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 8 },
  deleteText: { fontSize: 15, fontWeight: '600', color: c.danger },
});
