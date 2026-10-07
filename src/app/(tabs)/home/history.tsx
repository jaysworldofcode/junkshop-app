import { useCallback } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PurchaseListRow } from '@/components/PurchaseListRow';
import { Screen } from '@/components/Screen';
import { FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { formatDateLabel, relativeDayName, todayLocalDateKey } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import type { PurchaseListEntry } from '@/domain/purchaseHistory';
import { usePurchaseHistory } from '@/purchases/usePurchaseHistory';
import { useAppTheme } from '@/theme/useAppTheme';

export default function PurchaseHistoryScreen() {
  const { colors, colorScheme } = useAppTheme();
  const { sections, isLoading, error } = usePurchaseHistory();
  const today = todayLocalDateKey();

  const openPurchase = useCallback((purchase: PurchaseListEntry) => {
    router.push({ pathname: '/home/purchase/[id]', params: { id: purchase.id } });
  }, []);

  return (
    <Screen padded={false}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ItemGap}
        ListHeaderComponent={
          <>
            {error ? <ErrorBanner message={error} /> : null}
            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          </>
        }
        renderSectionHeader={({ section }) => {
          const dayName = relativeDayName(section.purchaseDate, today);
          const dateLabel = formatDateLabel(section.purchaseDate);

          return (
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                {(dayName ? `${dayName} · ${dateLabel}` : dateLabel).toUpperCase()}
              </Text>
              <Text style={[styles.sectionTotal, { color: colors.muted }]}>
                {section.data.length} · {formatPeso(section.dayTotal)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={{ ios: 'clock.fill', android: 'history', web: 'history' }}
              title="No purchases yet"
              body="Purchases saved on the Buy tab show up here, newest first."
            />
          )
        }
        renderItem={({ item }) => <PurchaseListRow purchase={item} onPress={openPurchase} />}
      />
    </Screen>
  );
}

function ItemGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SPACE_MD,
    paddingBottom: SPACE_MD,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACE_XS,
    paddingTop: SPACE_MD,
    paddingBottom: SPACE_SM,
    gap: SPACE_SM,
  },
  sectionTitle: {
    flex: 1,
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionTotal: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  itemGap: {
    height: SPACE_SM,
  },
});
