import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ChoiceChips } from '@/components/ChoiceChips';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FigureRow } from '@/components/FigureRow';
import { Screen } from '@/components/Screen';
import { TransactionRow } from '@/components/TransactionRow';
import { FONT_SIZE_CAPTION, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import {
  DEFAULT_TRANSACTION_FILTER,
  TRANSACTION_FILTER_LABELS,
  TRANSACTION_FILTERS,
  type TransactionFilter,
} from '@/constants/transaction';
import { useTransactions } from '@/dashboard/useDashboard';
import type { TransactionEntry } from '@/domain/dashboard';
import { formatRangeLabel } from '@/domain/dateRange';
import { isLocalDateKey, todayLocalDateKey } from '@/domain/localDate';
import { useAppTheme } from '@/theme/useAppTheme';

export default function TransactionsScreen() {
  const params = useLocalSearchParams<{ from: string; to: string }>();

  if (!isLocalDateKey(params.from) || !isLocalDateKey(params.to)) {
    return (
      <Screen>
        <ErrorBanner message="These transactions could not be opened. Go back and pick a period again." />
      </Screen>
    );
  }

  return <TransactionsList from={params.from} to={params.to} />;
}

function TransactionsList({ from, to }: { from: string; to: string }) {
  const { colors, colorScheme } = useAppTheme();
  const today = todayLocalDateKey();
  const [filter, setFilter] = useState<TransactionFilter>(DEFAULT_TRANSACTION_FILTER);
  const { data, isLoading, error } = useTransactions({ from, to });

  const shown = useMemo(
    () => (data ?? []).filter((transaction) => filter === 'all' || transaction.kind === filter),
    [data, filter]
  );

  const totals = useMemo(
    () =>
      shown.reduce(
        (sum, transaction) => ({
          sales: sum.sales + (transaction.kind === 'sale' ? transaction.totalAmount : 0),
          purchases: sum.purchases + (transaction.kind === 'purchase' ? transaction.totalAmount : 0),
          profit: sum.profit + (transaction.profit ?? 0),
        }),
        { sales: 0, purchases: 0, profit: 0 }
      ),
    [shown]
  );

  const openTransaction = useCallback((transaction: TransactionEntry) => {
    if (transaction.kind === 'sale') {
      router.push({ pathname: '/home/sale/[id]', params: { id: transaction.id } });
    } else {
      router.push({ pathname: '/home/purchase/[id]', params: { id: transaction.id } });
    }
  }, []);

  return (
    <Screen padded={false}>
      <FlatList
        data={shown}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ItemGap}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.rangeLabel, { color: colors.muted }]}>{formatRangeLabel({ from, to }, today).toUpperCase()}</Text>
            <ChoiceChips
              label="Show"
              options={TRANSACTION_FILTERS}
              getLabel={(option) => TRANSACTION_FILTER_LABELS[option]}
              value={filter}
              onChange={setFilter}
            />
            {error ? <ErrorBanner message={error} /> : null}
            {shown.length > 0 ? (
              <View style={[styles.totals, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {filter !== 'purchase' ? <FigureRow label="Sales" centavos={totals.sales} /> : null}
                {filter !== 'sale' ? <FigureRow label="Purchases" centavos={totals.purchases} /> : null}
                {filter !== 'purchase' ? (
                  <FigureRow label="Realized profit" centavos={totals.profit} tone="profit" emphasized />
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <EmptyState
              icon={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
              title={`No ${TRANSACTION_FILTER_LABELS[filter].toLowerCase()} in this period`}
              body="Try another filter, or go back and pick a different period."
            />
          )
        }
        renderItem={({ item }) => <TransactionRow transaction={item} onPress={openTransaction} />}
      />
    </Screen>
  );
}

function ItemGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  list: {
    padding: SPACE_MD,
    flexGrow: 1,
  },
  header: {
    gap: SPACE_MD,
    marginBottom: SPACE_MD,
  },
  rangeLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: SPACE_XS,
  },
  totals: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM,
  },
  itemGap: {
    height: SPACE_SM,
  },
});
