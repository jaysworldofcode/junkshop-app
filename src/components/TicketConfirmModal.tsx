import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FigureRow } from '@/components/FigureRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  FONT_SIZE_TITLE,
  MAX_CONTENT_WIDTH,
  RADIUS_LG,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { formatPeso } from '@/domain/money';
import type { PreviewLine } from '@/domain/ticketPreview';
import { useAppTheme } from '@/theme/useAppTheme';

type TicketConfirmModalProps = {
  visible: boolean;
  title: string;
  partyLabel: string;
  partyName: string;
  lines: PreviewLine[];
  total: number;
  /** Extra figures under the total, such as the profit on a sale. */
  extras?: { label: string; centavos: number; tone?: 'plain' | 'profit' }[];
  confirmLabel: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function TicketConfirmModal({
  visible,
  title,
  partyLabel,
  partyName,
  lines,
  total,
  extras = [],
  confirmLabel,
  isSubmitting,
  onConfirm,
  onCancel,
}: TicketConfirmModalProps) {
  const { colors, colorScheme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={isSubmitting ? undefined : onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.party, { color: colors.muted }]}>
            {partyLabel}: {partyName}
          </Text>

          <ScrollView
            style={[styles.list, { borderColor: colors.border }]}
            contentContainerStyle={styles.listContent}
            indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
            persistentScrollbar
          >
            {lines.map((line, index) => (
              <View
                key={line.key}
                style={[
                  styles.line,
                  index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={styles.lineCopy}>
                  <Text style={[styles.lineName, { color: colors.text }]}>{line.name}</Text>
                  {line.detail ? (
                    <Text style={[styles.lineDetail, { color: colors.muted }]}>{line.detail}</Text>
                  ) : null}
                </View>
                <Text style={[styles.lineTotal, { color: colors.text }]}>{formatPeso(line.total)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.totals}>
            <FigureRow label="Total" centavos={total} emphasized />
            {extras.map((extra) => (
              <FigureRow key={extra.label} label={extra.label} centavos={extra.centavos} tone={extra.tone} />
            ))}
          </View>

          <View style={styles.actions}>
            <View style={styles.action}>
              <PrimaryButton label="Back" variant="outline" onPress={onCancel} disabled={isSubmitting} />
            </View>
            <View style={styles.action}>
              <PrimaryButton
                label={confirmLabel}
                icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
                onPress={onConfirm}
                isLoading={isSubmitting}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE_MD,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM + 4,
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
  },
  party: {
    fontSize: FONT_SIZE_BODY - 1,
    marginTop: -SPACE_SM,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingVertical: SPACE_XS,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
    paddingVertical: SPACE_SM,
  },
  lineCopy: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  lineName: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  lineDetail: {
    fontSize: FONT_SIZE_CAPTION,
    fontVariant: ['tabular-nums'],
  },
  lineTotal: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  totals: {
    gap: SPACE_XS,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE_SM,
  },
  action: {
    flex: 1,
  },
});
