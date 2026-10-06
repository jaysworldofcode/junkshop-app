import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { EXPENSE_CATEGORY_LABELS } from '@/constants/expense';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  ICON_SIZE_SM,
  RADIUS_LG,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment';
import type { Expense } from '@/domain/expense';
import { formatDateLabel, relativeDayName, todayLocalDateKey } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import { useExpenses } from '@/expenses/useExpenses';
import { useAppTheme } from '@/theme/useAppTheme';

export default function ExpensesScreen() {
  const { colors, colorScheme } = useAppTheme();
  const { sections, isLoading, error } = useExpenses();
  const today = todayLocalDateKey();

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
          const dayName = relativeDayName(section.expenseDate, today);
          const dateLabel = formatDateLabel(section.expenseDate);

          return (
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                {(dayName ? `${dayName} · ${dateLabel}` : dateLabel).toUpperCase()}
              </Text>
              <Text style={[styles.sectionTotal, { color: colors.muted }]}>{formatPeso(section.dayTotal)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={{ ios: 'creditcard.fill', android: 'payments', web: 'payments' }}
              title="No expenses yet"
              body="Record wages, fuel, electricity, and other shop costs so net profit is correct."
            />
          )
        }
        renderItem={({ item }) => <ExpenseRow expense={item} />}
      />

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          label="Add expense"
          icon={{ ios: 'plus', android: 'add', web: 'add' }}
          onPress={() => router.push('/expenses/new')}
        />
      </View>
    </Screen>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const { colors } = useAppTheme();
  const category = EXPENSE_CATEGORY_LABELS[expense.category];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${category}, ${formatPeso(expense.amount)}`}
      accessibilityHint="Opens the expense to edit"
      onPress={() => router.push({ pathname: '/expenses/[id]', params: { id: expense.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.rowCopy}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
            {expense.title}
          </Text>
          <Text style={[styles.rowAmount, { color: colors.text }]}>{formatPeso(expense.amount)}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.rowDetails, { color: colors.muted }]}>
          {category} · {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
        </Text>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={colors.inactive}
        size={ICON_SIZE_SM}
      />
    </Pressable>
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
  row: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    paddingVertical: SPACE_SM + 4,
    paddingHorizontal: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  rowCopy: {
    flex: 1,
    gap: SPACE_XS,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACE_SM,
  },
  rowTitle: {
    flex: 1,
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  rowAmount: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rowDetails: {
    fontSize: FONT_SIZE_CAPTION,
  },
  footer: {
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
