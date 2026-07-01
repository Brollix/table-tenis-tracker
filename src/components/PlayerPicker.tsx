import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable,
} from 'react-native';
import { Player } from '../types';
import { Colors } from '../theme';
import { useColors } from '../context/SettingsContext';

interface Props {
  label: string;
  players: Player[];
  selected: number | null;
  disabledIds?: number[];
  onSelect: (id: number) => void;
}

export default function PlayerPicker({ label, players, selected, disabledIds = [], onSelect }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const selectedPlayer = players.find((p) => p.id === selected);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setOpen(true)}>
          <Text style={[styles.value, !selectedPlayer && styles.placeholder]}>
            {selectedPlayer ? selectedPlayer.name : 'Elegir jugador'}
          </Text>
          <Text style={styles.arrow}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={players}
            keyExtractor={(p) => String(p.id)}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay jugadores. Agregalos en la pestaña Jugadores.</Text>}
            renderItem={({ item }) => {
              const disabled = disabledIds.includes(item.id);
              const isSelected = item.id === selected;
              return (
                <TouchableOpacity
                  style={[styles.option, disabled && styles.optionDisabled, isSelected && styles.optionSelected]}
                  onPress={() => { if (!disabled) { onSelect(item.id); setOpen(false); } }}
                  disabled={disabled}
                >
                  <Text style={[styles.optionText, disabled && styles.optionTextDisabled, isSelected && styles.optionTextSelected]}>
                    {item.name}
                  </Text>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: c.textMuted, marginBottom: 6 },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: c.inputBg,
  },
  value: { fontSize: 15, color: c.text },
  placeholder: { color: c.textFaint },
  arrow: { fontSize: 14, color: c.textMuted },
  backdrop: { flex: 1, backgroundColor: c.overlay },
  sheet: {
    backgroundColor: c.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  emptyText: { textAlign: 'center', color: c.textFaint, padding: 24, fontSize: 14 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  optionDisabled: { opacity: 0.35 },
  optionSelected: { backgroundColor: c.primaryMuted },
  optionText: { fontSize: 16, color: c.text },
  optionTextDisabled: { color: c.textFaint },
  optionTextSelected: { color: c.primary, fontWeight: '600' },
  check: { fontSize: 16, color: c.primary },
});
