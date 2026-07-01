import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { useColors } from '../context/SettingsContext';

export interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

interface Props {
  visible: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  message?: string;
  bigValue?: string;
  actions: ModalAction[];
  onRequestClose?: () => void;
  dismissable?: boolean;
}

export default function AppModal({
  visible, icon, iconColor, title, message, bigValue, actions, onRequestClose, dismissable = false,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const btnStyle = (v: ModalAction['variant']) => {
    switch (v) {
      case 'secondary': return [styles.btn, styles.btnSecondary];
      case 'danger': return [styles.btn, styles.btnDanger];
      case 'success': return [styles.btn, styles.btnSuccess];
      default: return [styles.btn, styles.btnPrimary];
    }
  };
  const btnTextStyle = (v: ModalAction['variant']) =>
    v === 'secondary' ? styles.btnTextSecondary : styles.btnText;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={dismissable ? onRequestClose : undefined}>
        <Pressable style={styles.card} onPress={() => {}}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: (iconColor ?? c.primary) + '22' }]}>
              <Ionicons name={icon} size={30} color={iconColor ?? c.primary} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {bigValue && <Text style={[styles.bigValue, iconColor ? { color: iconColor } : null]}>{bigValue}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            {actions.map((a, i) => (
              <TouchableOpacity key={i} style={btnStyle(a.variant)} onPress={a.onPress} activeOpacity={0.8}>
                <Text style={btnTextStyle(a.variant)}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center', padding: 28 },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: c.text, textAlign: 'center' },
  bigValue: { fontSize: 44, fontWeight: '900', color: c.text, marginTop: 6 },
  message: { fontSize: 14, color: c.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  actions: { width: '100%', gap: 10, marginTop: 22 },
  btn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: c.primary },
  btnSuccess: { backgroundColor: c.success },
  btnDanger: { backgroundColor: c.danger },
  btnSecondary: { backgroundColor: c.toggleBg },
  btnText: { fontSize: 16, fontWeight: '700', color: c.onPrimary },
  btnTextSecondary: { fontSize: 16, fontWeight: '700', color: c.text },
});
