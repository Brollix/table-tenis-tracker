import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPlayers } from '../../../src/db/players';
import { getMatch, updateMatch } from '../../../src/db/matches';
import { Player, Mode, NewMatchData } from '../../../src/types';
import PlayerPicker from '../../../src/components/PlayerPicker';
import SetScoreInput from '../../../src/components/SetScoreInput';
import { setsWon, computeWinner } from '../../../src/lib/match';
import { Colors } from '../../../src/theme';
import { useColors } from '../../../src/context/SettingsContext';

interface SetRow { team1: string; team2: string }
const emptySet = (): SetRow => ({ team1: '', team2: '' });

export default function EditMatchScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<Mode>('singles');
  const [t1p1, setT1p1] = useState<number | null>(null);
  const [t1p2, setT1p2] = useState<number | null>(null);
  const [t2p1, setT2p1] = useState<number | null>(null);
  const [t2p2, setT2p2] = useState<number | null>(null);
  const [sets, setSets] = useState<SetRow[]>([emptySet()]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [ps, m] = await Promise.all([getPlayers(), getMatch(Number(id))]);
      setPlayers(ps);
      if (m) {
        setMode(m.mode);
        setT1p1(m.team1_player1);
        setT1p2(m.team1_player2);
        setT2p1(m.team2_player1);
        setT2p2(m.team2_player2);
        setSets(m.sets.length
          ? m.sets.map((s) => ({ team1: String(s.team1_score), team2: String(s.team2_score) }))
          : [emptySet()]);
      }
      setLoaded(true);
    })();
  }, [id]);

  const selectedIds = [t1p1, t1p2, t2p1, t2p2].filter(Boolean) as number[];

  const t1Label = mode === 'singles'
    ? (players.find((p) => p.id === t1p1)?.name || 'Team 1')
    : [players.find((p) => p.id === t1p1)?.name, players.find((p) => p.id === t1p2)?.name].filter(Boolean).join(' & ') || 'Team 1';
  const t2Label = mode === 'singles'
    ? (players.find((p) => p.id === t2p1)?.name || 'Team 2')
    : [players.find((p) => p.id === t2p1)?.name, players.find((p) => p.id === t2p2)?.name].filter(Boolean).join(' & ') || 'Team 2';

  const parsedSets = sets
    .filter((s) => s.team1 !== '' && s.team2 !== '' && s.team1 !== s.team2)
    .map((s) => ({ team1_score: parseInt(s.team1, 10), team2_score: parseInt(s.team2, 10) }));
  const won = setsWon(parsedSets);
  const leading = computeWinner(parsedSets);

  const updateSet = (idx: number, team: 'team1' | 'team2', val: string) => {
    setSets((prev) => prev.map((s, i) => i === idx ? { ...s, [team]: val.replace(/\D/g, '') } : s));
  };

  const handleSave = async () => {
    if (!t1p1 || !t2p1) { Alert.alert('Missing info', 'Select all players'); return; }
    if (mode === 'doubles' && (!t1p2 || !t2p2)) { Alert.alert('Missing info', 'Select all players for doubles'); return; }
    for (const s of sets) {
      if (s.team1 === '' || s.team2 === '') { Alert.alert('Missing info', 'Fill in the scores for all games'); return; }
      if (s.team1 === s.team2) { Alert.alert('Invalid score', 'A game cannot end tied'); return; }
    }
    const winner = computeWinner(parsedSets);
    if (winner === null) { Alert.alert('Tied result', 'The games are tied, add a deciding game'); return; }

    setSaving(true);
    const data: NewMatchData = {
      mode,
      team1_player1: t1p1,
      team1_player2: mode === 'doubles' ? t1p2 : null,
      team2_player1: t2p1,
      team2_player2: mode === 'doubles' ? t2p2 : null,
      winner_team: winner,
      sets: parsedSets,
    };
    try {
      await updateMatch(Number(id), data);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save the match');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <View style={styles.loader}><ActivityIndicator color={c.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Format</Text>
        <View style={styles.toggle}>
          {(['singles', 'doubles'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              onPress={() => { setMode(m); if (m === 'singles') { setT1p2(null); setT2p2(null); } }}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'singles' ? 'Singles' : 'Doubles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.teamsRow}>
          <View style={styles.teamCol}>
            <Text style={styles.teamHeader}>Team 1</Text>
            <PlayerPicker label="Player 1" players={players} selected={t1p1} disabledIds={selectedIds.filter((x) => x !== t1p1)} onSelect={setT1p1} />
            {mode === 'doubles' && <PlayerPicker label="Player 2" players={players} selected={t1p2} disabledIds={selectedIds.filter((x) => x !== t1p2)} onSelect={setT1p2} />}
          </View>
          <View style={styles.vsCol}><Text style={styles.vs}>VS</Text></View>
          <View style={styles.teamCol}>
            <Text style={styles.teamHeader}>Team 2</Text>
            <PlayerPicker label="Player 1" players={players} selected={t2p1} disabledIds={selectedIds.filter((x) => x !== t2p1)} onSelect={setT2p1} />
            {mode === 'doubles' && <PlayerPicker label="Player 2" players={players} selected={t2p2} disabledIds={selectedIds.filter((x) => x !== t2p2)} onSelect={setT2p2} />}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Games</Text>
        {sets.map((s, i) => (
          <SetScoreInput
            key={i}
            index={i}
            team1Score={s.team1}
            team2Score={s.team2}
            team1Label={t1Label}
            team2Label={t2Label}
            onChangeTeam1={(v) => updateSet(i, 'team1', v)}
            onChangeTeam2={(v) => updateSet(i, 'team2', v)}
            onRemove={() => setSets((prev) => prev.filter((_, idx) => idx !== i))}
            canRemove={sets.length > 1}
          />
        ))}
        <TouchableOpacity style={styles.addSetBtn} onPress={() => setSets((prev) => [...prev, emptySet()])}>
          <Text style={styles.addSetText}>+ Add game</Text>
        </TouchableOpacity>
      </View>

      {parsedSets.length > 0 && (
        <View style={[styles.feedback, leading === null ? styles.feedbackTie : styles.feedbackWin]}>
          <Text style={[styles.feedbackText, leading !== null && styles.feedbackTextWin]}>
            {leading === null
              ? `Tie ${won.team1}-${won.team2}`
              : `${leading === 1 ? t1Label : t2Label} wins (${won.team1}-${won.team2})`}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={c.onPrimary} /> : <Text style={styles.primaryBtnText}>Save changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
  container: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  toggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: c.toggleBg, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: c.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  toggleTextActive: { color: c.onPrimary },
  teamsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  teamCol: { flex: 1 },
  vsCol: { width: 36, alignItems: 'center', paddingTop: 28 },
  vs: { fontSize: 13, fontWeight: '800', color: c.textFaint },
  teamHeader: { fontSize: 12, fontWeight: '700', color: c.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  addSetBtn: { marginTop: 6, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: c.borderStrong, borderStyle: 'dashed' },
  addSetText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
  feedback: { padding: 14, borderRadius: 12, marginBottom: 14, alignItems: 'center' },
  feedbackWin: { backgroundColor: c.successMuted },
  feedbackTie: { backgroundColor: c.toggleBg },
  feedbackText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  feedbackTextWin: { color: c.text },
  primaryBtn: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: c.onPrimary },
});
