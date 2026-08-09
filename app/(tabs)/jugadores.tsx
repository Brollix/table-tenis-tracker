import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPlayers, addPlayer, deletePlayer, getPlayerMatchCount } from '../../src/db/players';
import { Player } from '../../src/types';
import { Colors } from '../../src/theme';
import { useColors } from '../../src/context/SettingsContext';

export default function JugadoresScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setPlayers(await getPlayers());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    await addPlayer(trimmed);
    setName('');
    await load();
    setLoading(false);
  };

  const handleDelete = async (player: Player) => {
    const count = await getPlayerMatchCount(player.id);
    if (count > 0) {
      Alert.alert(
        "Can't delete",
        `${player.name} has ${count} recorded match${count > 1 ? 'es' : ''}.`,
      );
      return;
    }
    Alert.alert('Delete player', `Delete ${player.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deletePlayer(player.id);
          await load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Player name"
          placeholderTextColor={c.textFaint}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, (!name.trim() || loading) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim() || loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>+</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={players}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.playerRow}
            onLongPress={() => handleDelete(item)}
            delayLongPress={500}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.hint}>hold to delete</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Add players to get started</Text>
          </View>
        }
        contentContainerStyle={players.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: c.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderStrong,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: c.inputBg,
    color: c.text,
  },
  addBtn: {
    backgroundColor: c.primary,
    borderRadius: 10,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { fontSize: 24, color: c.onPrimary, lineHeight: 28 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: c.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: c.primary },
  playerName: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text },
  hint: { fontSize: 10, color: c.textFaint },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: c.textFaint, textAlign: 'center' },
});
