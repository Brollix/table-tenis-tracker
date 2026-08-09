import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getPlayers } from '../../src/db/players';
import { addMatch } from '../../src/db/matches';
import { Player, Mode, NewMatchData } from '../../src/types';
import PlayerPicker from '../../src/components/PlayerPicker';
import SetScoreInput from '../../src/components/SetScoreInput';
import { setsWon, computeWinner } from '../../src/lib/match';
import { Colors } from '../../src/theme';
import { useColors, useSettings } from '../../src/context/SettingsContext';

interface SetRow { team1: string; team2: string }
type EntryMode = 'manual' | 'live';

const emptySet = (): SetRow => ({ team1: '', team2: '' });

export default function NuevoScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const router = useRouter();
  const { settings, update } = useSettings();
  const [players, setPlayers] = useState<Player[]>([]);
  const [entry, setEntry] = useState<EntryMode>('manual');
  const [bestOf, setBestOf] = useState<number>(settings.bestOf);
  const [mode, setMode] = useState<Mode>('singles');
  const [t1p1, setT1p1] = useState<number | null>(null);
  const [t1p2, setT1p2] = useState<number | null>(null);
  const [t2p1, setT2p1] = useState<number | null>(null);
  const [t2p2, setT2p2] = useState<number | null>(null);
  const [sets, setSets] = useState<SetRow[]>([emptySet()]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    getPlayers().then(setPlayers);
  }, []));

  const selectedIds = [t1p1, t1p2, t2p1, t2p2].filter(Boolean) as number[];

  const t1Label = mode === 'singles'
    ? (players.find((p) => p.id === t1p1)?.name || 'Team 1')
    : [players.find((p) => p.id === t1p1)?.name, players.find((p) => p.id === t1p2)?.name].filter(Boolean).join(' & ') || 'Team 1';

  const t2Label = mode === 'singles'
    ? (players.find((p) => p.id === t2p1)?.name || 'Team 2')
    : [players.find((p) => p.id === t2p1)?.name, players.find((p) => p.id === t2p2)?.name].filter(Boolean).join(' & ') || 'Team 2';

  // parsed sets for live feedback (only complete, non-tied rows count)
  const parsedSets = sets
    .filter((s) => s.team1 !== '' && s.team2 !== '' && s.team1 !== s.team2)
    .map((s) => ({ team1_score: parseInt(s.team1, 10), team2_score: parseInt(s.team2, 10) }));
  const won = setsWon(parsedSets);
  const leading = computeWinner(parsedSets); // 1 | 2 | null

  const updateSet = (idx: number, team: 'team1' | 'team2', val: string) => {
    setSets((prev) => prev.map((s, i) => i === idx ? { ...s, [team]: val.replace(/\D/g, '') } : s));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setT1p2(null);
    setT2p2(null);
  };

  const playersReady = (): string | null => {
    if (!t1p1 || !t2p1) return 'Select all players';
    if (mode === 'doubles' && (!t1p2 || !t2p2)) return 'Select all players for doubles';
    return null;
  };

  const goLive = () => {
    const err = playersReady();
    if (err) { Alert.alert('Missing info', err); return; }
    update('bestOf', bestOf); // recordar la última elección
    router.push({
      pathname: '/live',
      params: {
        mode,
        bestOf: String(bestOf),
        t1p1: String(t1p1),
        t1p2: t1p2 ? String(t1p2) : '',
        t2p1: String(t2p1),
        t2p2: t2p2 ? String(t2p2) : '',
        t1Label,
        t2Label,
      },
    });
  };

  const handleSave = async () => {
    const err = playersReady();
    if (err) { Alert.alert('Missing info', err); return; }
    for (const s of sets) {
      if (s.team1 === '' || s.team2 === '') { Alert.alert('Missing info', 'Fill in the scores for all games'); return; }
      if (s.team1 === s.team2) { Alert.alert('Invalid score', 'A game cannot end tied'); return; }
    }
    const winner = computeWinner(parsedSets);
    if (winner === null) { Alert.alert('Tied result', 'The games are tied, add a deciding game'); return; }

    setSaving(true);
    const data: NewMatchData = {
      mode,
      team1_player1: t1p1!,
      team1_player2: mode === 'doubles' ? t1p2 : null,
      team2_player1: t2p1!,
      team2_player2: mode === 'doubles' ? t2p2 : null,
      winner_team: winner,
      sets: parsedSets,
    };

    try {
      await addMatch(data);
      setT1p1(null); setT1p2(null); setT2p1(null); setT2p2(null);
      setSets([emptySet()]); setMode('singles');
      router.navigate('/(tabs)/');
    } catch (e) {
      Alert.alert('Error', 'Could not save the match');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Tipo de carga */}
      <View style={styles.segment}>
        {(['manual', 'live'] as EntryMode[]).map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.segmentBtn, entry === e && styles.segmentBtnActive]}
            onPress={() => setEntry(e)}
          >
            <Ionicons
              name={e === 'manual' ? 'create-outline' : 'flash-outline'}
              size={16}
              color={entry === e ? c.onPrimary : c.textMuted}
            />
            <Text style={[styles.segmentText, entry === e && styles.segmentTextActive]}>
              {e === 'manual' ? 'Manual entry' : 'Live'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modalidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Format</Text>
        <View style={styles.toggle}>
          {(['singles', 'doubles'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'singles' ? 'Singles' : 'Doubles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Jugadores */}
      <View style={styles.section}>
        <View style={styles.teamsRow}>
          <View style={styles.teamCol}>
            <Text style={styles.teamHeader}>Team 1</Text>
            <PlayerPicker label="Player 1" players={players} selected={t1p1} disabledIds={selectedIds.filter((id) => id !== t1p1)} onSelect={setT1p1} />
            {mode === 'doubles' && <PlayerPicker label="Player 2" players={players} selected={t1p2} disabledIds={selectedIds.filter((id) => id !== t1p2)} onSelect={setT1p2} />}
          </View>
          <View style={styles.vsCol}><Text style={styles.vs}>VS</Text></View>
          <View style={styles.teamCol}>
            <Text style={styles.teamHeader}>Team 2</Text>
            <PlayerPicker label="Player 1" players={players} selected={t2p1} disabledIds={selectedIds.filter((id) => id !== t2p1)} onSelect={setT2p1} />
            {mode === 'doubles' && <PlayerPicker label="Player 2" players={players} selected={t2p2} disabledIds={selectedIds.filter((id) => id !== t2p2)} onSelect={setT2p2} />}
          </View>
        </View>
      </View>

      {entry === 'manual' ? (
        <>
          {/* Sets */}
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

          {/* Feedback de ganador automático */}
          {parsedSets.length > 0 && (
            <View style={[
              styles.feedback,
              leading === null ? styles.feedbackTie : styles.feedbackWin,
            ]}>
              <Ionicons
                name={leading === null ? 'remove-circle-outline' : 'trophy'}
                size={20}
                color={leading === null ? c.textMuted : c.success}
              />
              <Text style={[styles.feedbackText, leading !== null && styles.feedbackTextWin]}>
                {leading === null
                  ? `Tie ${won.team1}-${won.team2}`
                  : `${leading === 1 ? t1Label : t2Label} leading (${won.team1}-${won.team2})`}
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color={c.onPrimary} />
              : <Text style={styles.primaryBtnText}>Save match</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best of</Text>
            <View style={styles.toggle}>
              {[3, 5, 7, 9].map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.toggleBtn, bestOf === b && styles.toggleBtnActive]}
                  onPress={() => setBestOf(b)}
                >
                  <Text style={[styles.toggleText, bestOf === b && styles.toggleTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>
              First to {Math.floor(bestOf / 2) + 1} games wins.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={goLive}>
            <Ionicons name="flash" size={18} color={c.onPrimary} />
            <Text style={styles.primaryBtnText}>Start live match</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, paddingBottom: 40 },
  segment: { flexDirection: 'row', backgroundColor: c.toggleBg, borderRadius: 12, padding: 4, marginBottom: 14 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  segmentBtnActive: { backgroundColor: c.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  segmentTextActive: { color: c.onPrimary },
  section: {
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  hint: { fontSize: 12, color: c.textFaint, marginTop: 10 },
  addSetBtn: { marginTop: 6, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: c.borderStrong, borderStyle: 'dashed' },
  addSetText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 14 },
  feedbackWin: { backgroundColor: c.successMuted },
  feedbackTie: { backgroundColor: c.toggleBg },
  feedbackText: { fontSize: 14, fontWeight: '600', color: c.textMuted, flex: 1 },
  feedbackTextWin: { color: c.text },
  primaryBtn: { flexDirection: 'row', gap: 8, backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: c.onPrimary },
});
