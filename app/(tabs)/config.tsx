import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Colors } from '../../src/theme';
import { useColors, useSettings } from '../../src/context/SettingsContext';
import { exportAllData } from '../../src/db/backup';

export default function ConfigScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { settings, update } = useSettings();
  const deuce = settings.pointsPerSet - 1;
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const stamp = new Date(data.exportedAt * 1000).toISOString().slice(0, 10);
      const uri = `${FileSystem.cacheDirectory}pingpong-backup-${stamp}.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Tracker TDM data',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Exported', `File saved to:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not export the data.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Ionicons name="moon" size={20} color={c.primary} />
            <Text style={styles.rowText}>Dark mode</Text>
          </View>
          <Switch
            value={settings.theme === 'dark'}
            onValueChange={(v) => update('theme', v ? 'dark' : 'light')}
            trackColor={{ true: c.primary, false: c.borderStrong }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Match rules */}
      <Text style={styles.sectionTitle}>Match rules</Text>
      <View style={styles.card}>
        <View style={styles.rowColumn}>
          <Text style={styles.rowText}>Points per game</Text>
          <View style={styles.options}>
            {[11, 21].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.option, settings.pointsPerSet === p && styles.optionActive]}
                onPress={() => update('pointsPerSet', p)}
              >
                <Text style={[styles.optionText, settings.pointsPerSet === p && styles.optionTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.rowColumn}>
          <Text style={styles.rowText}>Deuce rule</Text>
          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.option, settings.winByTwo && styles.optionActive]}
              onPress={() => update('winByTwo', true)}
            >
              <Text style={[styles.optionText, settings.winByTwo && styles.optionTextActive]}>Win by 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, !settings.winByTwo && styles.optionActive]}
              onPress={() => update('winByTwo', false)}
            >
              <Text style={[styles.optionText, !settings.winByTwo && styles.optionTextActive]}>Golden point</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.optionNote}>
            {settings.winByTwo
              ? `At ${deuce}-${deuce}, you don't win at ${settings.pointsPerSet}: play continues until someone leads by 2 (${settings.pointsPerSet + 1}-${deuce}, ${settings.pointsPerSet + 2}-${settings.pointsPerSet}, etc.).`
              : `Sudden death: at ${deuce}-${deuce}, the next point decides the game (won ${settings.pointsPerSet}-${deuce}).`}
          </Text>
        </View>
      </View>

      <Text style={styles.note}>
        "Best of" is chosen when starting each live match.
      </Text>

      {/* Data */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={handleExport} disabled={exporting}>
          <View style={styles.rowLabel}>
            <Ionicons name="download-outline" size={20} color={c.primary} />
            <Text style={styles.rowText}>Export data (JSON)</Text>
          </View>
          {exporting
            ? <ActivityIndicator color={c.primary} />
            : <Ionicons name="chevron-forward" size={18} color={c.textFaint} />}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Generates a file with all players and matches to back up or migrate to a server later.
      </Text>
    </ScrollView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8, marginLeft: 4 },
  card: { backgroundColor: c.card, borderRadius: 14, paddingHorizontal: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  rowColumn: { paddingVertical: 16, gap: 12 },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 16, color: c.text, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
  options: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: c.toggleBg, alignItems: 'center' },
  optionActive: { backgroundColor: c.primary },
  optionText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  optionTextActive: { color: c.onPrimary },
  optionNote: { fontSize: 12, color: c.textFaint, lineHeight: 18 },
  note: { fontSize: 12, color: c.textFaint, lineHeight: 18, marginTop: 8, marginHorizontal: 4 },
});
