import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addMatch } from '../src/db/matches';
import { Mode, NewMatchData } from '../src/types';
import { isSetComplete, isMatchComplete, setsWon, computeWinner, setsToWin, currentServer, MatchRules } from '../src/lib/match';
import { Colors } from '../src/theme';
import { useColors, useSettings } from '../src/context/SettingsContext';
import AppModal from '../src/components/AppModal';

interface CompletedSet { team1_score: number; team2_score: number }

export default function LiveScreen() {
  const c = useColors();
  const { settings } = useSettings();
  const styles = useMemo(() => createStyles(c), [c]);
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode: Mode; bestOf: string; t1p1: string; t1p2: string; t2p1: string; t2p2: string; t1Label: string; t2Label: string;
  }>();

  const t1Label = params.t1Label || 'Equipo 1';
  const t2Label = params.t2Label || 'Equipo 2';

  const rules: MatchRules = {
    pointsPerSet: settings.pointsPerSet,
    winByTwo: settings.winByTwo,
    bestOf: params.bestOf ? Number(params.bestOf) : settings.bestOf,
  };

  const [cur1, setCur1] = useState(0);
  const [cur2, setCur2] = useState(0);
  const [completed, setCompleted] = useState<CompletedSet[]>([]);
  // sesión: partidos ganados por cada equipo
  const [sessionT1, setSessionT1] = useState(0);
  const [sessionT2, setSessionT2] = useState(0);
  const [matchSaved, setMatchSaved] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [firstServer, setFirstServer] = useState<1 | 2>(1); // quién saca primero en el partido
  const savingRef = useRef(false);

  const won = setsWon(completed);
  const target = setsToWin(rules);
  const matchOver = isMatchComplete(completed, rules);
  const finalWinner = computeWinner(completed);
  const matchNum = sessionT1 + sessionT2 + 1;

  // Saque: el primer sacador alterna en cada juego del partido.
  const gameFirstServer: 1 | 2 = completed.length % 2 === 0 ? firstServer : (firstServer === 1 ? 2 : 1);
  const server = currentServer(gameFirstServer, cur1 + cur2, rules.pointsPerSet);
  const matchNotStarted = completed.length === 0 && cur1 === 0 && cur2 === 0;

  // Guarda el partido automáticamente apenas se completa.
  useEffect(() => {
    if (!matchOver || matchSaved || savingRef.current) return;
    savingRef.current = true;
    const winner = computeWinner(completed);
    if (winner === null) { savingRef.current = false; return; }
    const data: NewMatchData = {
      mode: params.mode,
      team1_player1: Number(params.t1p1),
      team1_player2: params.t1p2 ? Number(params.t1p2) : null,
      team2_player1: Number(params.t2p1),
      team2_player2: params.t2p2 ? Number(params.t2p2) : null,
      winner_team: winner,
      sets: completed,
    };
    addMatch(data)
      .then(() => {
        if (winner === 1) setSessionT1((v) => v + 1);
        else setSessionT2((v) => v + 1);
        setMatchSaved(true);
      })
      .finally(() => { savingRef.current = false; });
  }, [matchOver, matchSaved]);

  const addPoint = (team: 1 | 2) => {
    if (matchOver) return;
    const n1 = team === 1 ? cur1 + 1 : cur1;
    const n2 = team === 2 ? cur2 + 1 : cur2;
    if (isSetComplete(n1, n2, rules)) {
      setCompleted((prev) => [...prev, { team1_score: n1, team2_score: n2 }]);
      setCur1(0);
      setCur2(0);
    } else {
      setCur1(n1);
      setCur2(n2);
    }
  };

  const removePoint = (team: 1 | 2) => {
    if (team === 1) setCur1((v) => Math.max(0, v - 1));
    else setCur2((v) => Math.max(0, v - 1));
  };

  const undoLastGame = () => {
    if (completed.length === 0 || matchOver) return;
    setCompleted((prev) => prev.slice(0, -1));
    setCur1(0);
    setCur2(0);
  };

  const nextMatch = () => {
    setCompleted([]);
    setCur1(0);
    setCur2(0);
    setMatchSaved(false);
  };

  const finishSession = () => {
    router.dismissAll();
    router.replace('/(tabs)/');
  };

  const handleExitPress = () => {
    const inProgress = cur1 > 0 || cur2 > 0 || completed.length > 0;
    if (sessionT1 + sessionT2 === 0 && !inProgress) {
      router.back();
      return;
    }
    setShowExit(true);
  };

  const Panel = ({ team, label, cur, gamesW, serving }: { team: 1 | 2; label: string; cur: number; gamesW: number; serving: boolean }) => {
    const isWinner = matchOver && finalWinner === team;
    return (
      <TouchableOpacity
        style={[styles.panel, team === 1 ? styles.panelTop : styles.panelBottom, isWinner && styles.panelWinner]}
        activeOpacity={matchOver ? 1 : 0.85}
        onPress={() => addPoint(team)}
      >
        <View style={styles.panelHeader}>
          <View style={styles.nameRow}>
            {serving && !matchOver && (
              <View style={styles.serveBadge}>
                <Ionicons name="tennisball" size={13} color={c.success} />
                <Text style={styles.serveBadgeText}>SAQUE</Text>
              </View>
            )}
            <Text style={styles.panelName} numberOfLines={1}>{label}</Text>
          </View>
          <View style={styles.setsDots}>
            {Array.from({ length: target }).map((_, i) => (
              <View key={i} style={[styles.dot, i < gamesW && styles.dotOn]} />
            ))}
          </View>
        </View>

        <Text style={styles.bigScore}>{cur}</Text>

        {!matchOver && (
          <TouchableOpacity style={styles.minusBtn} onPress={() => removePoint(team)}>
            <Ionicons name="remove" size={22} color={c.onPrimary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleExitPress} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.sessionScore}>{sessionT1} – {sessionT2}</Text>
          <Text style={styles.rulesText}>
            Partido {matchNum} · Juego {Math.min(completed.length + 1, rules.bestOf)} · al mejor de {rules.bestOf}
          </Text>
        </View>
        <TouchableOpacity onPress={undoLastGame} style={styles.iconBtn} disabled={completed.length === 0 || matchOver}>
          <Ionicons name="arrow-undo" size={22} color={completed.length === 0 || matchOver ? c.textFaint : c.text} />
        </TouchableOpacity>
      </View>

      {completed.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsBar} contentContainerStyle={styles.chips}>
          {completed.map((s, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>{s.team1_score}-{s.team2_score}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Saque: elegible al inicio del partido, indicador después */}
      {matchNotStarted ? (
        <View style={styles.serveBar}>
          <Text style={styles.serveBarLabel}>¿Quién saca primero?</Text>
          <View style={styles.serveOptions}>
            {([1, 2] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.serveOption, firstServer === t && styles.serveOptionActive]}
                onPress={() => setFirstServer(t)}
              >
                <Text style={[styles.serveOptionText, firstServer === t && styles.serveOptionTextActive]} numberOfLines={1}>
                  {t === 1 ? t1Label : t2Label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.serveInfo}>
          <Ionicons name="tennisball" size={14} color={c.success} />
          <Text style={styles.serveInfoText}>Saca {server === 1 ? t1Label : t2Label}</Text>
        </View>
      )}

      <Panel team={1} label={t1Label} cur={cur1} gamesW={won.team1} serving={server === 1} />
      <Panel team={2} label={t2Label} cur={cur2} gamesW={won.team2} serving={server === 2} />

      <View style={styles.hintBar}>
        <Text style={styles.hintText}>Tocá cada lado para sumar un punto</Text>
      </View>

      {/* Partido terminado → seguir o terminar sesión */}
      <AppModal
        visible={matchOver && matchSaved}
        icon="trophy"
        iconColor={c.success}
        title={`¡Partido para ${finalWinner === 1 ? t1Label : t2Label}!`}
        bigValue={`${won.team1} - ${won.team2}`}
        message={`Sesión: ${sessionT1} a ${sessionT2}`}
        actions={[
          { label: 'Siguiente partido', variant: 'success', onPress: nextMatch },
          { label: 'Terminar sesión', variant: 'secondary', onPress: finishSession },
        ]}
      />

      {/* Confirmar salida */}
      <AppModal
        visible={showExit}
        icon="exit-outline"
        iconColor={c.danger}
        title="Terminar la sesión"
        message={
          sessionT1 + sessionT2 > 0
            ? `Ya se guardaron ${sessionT1 + sessionT2} partido${sessionT1 + sessionT2 > 1 ? 's' : ''}. El partido en curso (si hay) no se guarda.`
            : 'El partido en curso no se va a guardar.'
        }
        onRequestClose={() => setShowExit(false)}
        dismissable
        actions={[
          { label: 'Terminar sesión', variant: 'danger', onPress: finishSession },
          { label: 'Seguir jugando', variant: 'secondary', onPress: () => setShowExit(false) },
        ]}
      />
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { padding: 8 },
  topInfo: { alignItems: 'center' },
  sessionScore: { fontSize: 22, fontWeight: '900', color: c.text, letterSpacing: 1 },
  rulesText: { fontSize: 11, color: c.textMuted },
  chipsBar: { maxHeight: 40, flexGrow: 0 },
  chips: { paddingHorizontal: 12, gap: 6, alignItems: 'center' },
  chip: { backgroundColor: c.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 13, fontWeight: '700', color: c.textMuted },
  serveBar: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  serveBarLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  serveOptions: { flexDirection: 'row', gap: 8 },
  serveOption: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: c.toggleBg, alignItems: 'center' },
  serveOptionActive: { backgroundColor: c.success },
  serveOptionText: { fontSize: 14, fontWeight: '700', color: c.textMuted },
  serveOptionTextActive: { color: '#fff' },
  serveInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  serveInfoText: { fontSize: 13, fontWeight: '700', color: c.text },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serveBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  serveBadgeText: { fontSize: 9, fontWeight: '900', color: c.success, letterSpacing: 0.5 },
  panel: {
    flex: 1,
    margin: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  panelTop: { backgroundColor: c.primary, marginBottom: 5 },
  panelBottom: { backgroundColor: '#334155', marginTop: 5 },
  panelWinner: { borderWidth: 4, borderColor: c.success },
  panelHeader: { position: 'absolute', top: 16, left: 16, right: 16, alignItems: 'center', gap: 8 },
  panelName: { fontSize: 18, fontWeight: '800', color: c.onPrimary },
  setsDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotOn: { backgroundColor: c.success },
  bigScore: { fontSize: 120, fontWeight: '900', color: c.onPrimary, lineHeight: 130 },
  minusBtn: { position: 'absolute', bottom: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  hintBar: { padding: 14, alignItems: 'center' },
  hintText: { fontSize: 13, color: c.textFaint },
});
