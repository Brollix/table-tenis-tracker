import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { useColors } from '../context/SettingsContext';

interface Props {
  index: number;
  team1Score: string;
  team2Score: string;
  team1Label: string;
  team2Label: string;
  onChangeTeam1: (val: string) => void;
  onChangeTeam2: (val: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function SetScoreInput({
  index, team1Score, team2Score, team1Label, team2Label,
  onChangeTeam1, onChangeTeam2, onRemove, canRemove,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      <Text style={styles.setLabel}>Set {index + 1}</Text>

      <View style={styles.scoreGroup}>
        <Text style={styles.playerLabel} numberOfLines={1}>{team1Label}</Text>
        <TextInput
          style={styles.input}
          value={team1Score}
          onChangeText={onChangeTeam1}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
          placeholderTextColor={c.textFaint}
        />
      </View>

      <Text style={styles.dash}>—</Text>

      <View style={styles.scoreGroup}>
        <Text style={styles.playerLabel} numberOfLines={1}>{team2Label}</Text>
        <TextInput
          style={styles.input}
          value={team2Score}
          onChangeText={onChangeTeam2}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
          placeholderTextColor={c.textFaint}
        />
      </View>

      {canRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  setLabel: { fontSize: 13, fontWeight: '600', color: c.textMuted, width: 42 },
  scoreGroup: { flex: 1, alignItems: 'center', gap: 4 },
  playerLabel: { fontSize: 10, color: c.textFaint, fontWeight: '500', textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 8,
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: c.inputBg,
    color: c.text,
  },
  dash: { fontSize: 18, color: c.textFaint, marginTop: 14 },
  removeBtn: { padding: 6, marginTop: 14 },
  removeText: { fontSize: 14, color: c.danger },
});
