import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '../types';
import { setsWon } from '../lib/match';
import { Colors } from '../theme';
import { useColors } from '../context/SettingsContext';

interface Props {
  match: Match;
  onPress: () => void;
}

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

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MatchCard({ match, onPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const t1Won = match.winner_team === 1;
  const t1 = teamLabel(match, 1);
  const t2 = teamLabel(match, 2);
  const won = setsWon(match.sets);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.mode}>{match.mode === 'singles' ? 'Singles' : 'Doubles'}</Text>
        <Text style={styles.date}>{formatDate(match.played_at)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.teams}>
          <View style={styles.teamRow}>
            {t1Won && <Ionicons name="trophy" size={14} color={c.success} style={styles.trophy} />}
            <Text style={[styles.teamName, t1Won && styles.winner]} numberOfLines={1}>{t1}</Text>
          </View>
          <View style={styles.teamRow}>
            {!t1Won && <Ionicons name="trophy" size={14} color={c.success} style={styles.trophy} />}
            <Text style={[styles.teamName, !t1Won && styles.winner]} numberOfLines={1}>{t2}</Text>
          </View>
        </View>

        <View style={styles.scoreBox}>
          <Text style={[styles.setScore, t1Won && styles.setWinner]}>{won.team1}</Text>
          <Text style={styles.setDash}>-</Text>
          <Text style={[styles.setScore, !t1Won && styles.setWinner]}>{won.team2}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mode: {
    fontSize: 11,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: { fontSize: 11, color: c.textFaint },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teams: { flex: 1, gap: 6 },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  trophy: { marginRight: 5 },
  teamName: { fontSize: 15, color: c.textMuted, flexShrink: 1 },
  winner: { color: c.text, fontWeight: '700' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  setScore: { fontSize: 22, fontWeight: '800', color: c.textFaint },
  setWinner: { color: c.text },
  setDash: { fontSize: 18, color: c.textFaint },
});
