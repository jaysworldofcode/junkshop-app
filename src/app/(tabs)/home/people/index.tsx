import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { StatusBadge } from '@/components/StatusBadge';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, ICON_SIZE_SM, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { PERSON_TYPE_LABELS } from '@/constants/person';
import { matchesPersonSearch, type Person } from '@/domain/person';
import { usePeople } from '@/people/usePeople';
import { useAppTheme } from '@/theme/useAppTheme';

export default function PeopleScreen() {
  const { colors, colorScheme } = useAppTheme();
  const { people, isLoading, error } = usePeople();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => people.filter((person) => matchesPersonSearch(person, search)), [people, search]);

  return (
    <Screen padded={false}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ItemGap}
        ListHeaderComponent={
          <View style={styles.header}>
            {error ? <ErrorBanner message={error} /> : null}
            {people.length > 0 ? (
              <SearchField value={search} onChangeText={setSearch} placeholder="Search name, phone, or address" />
            ) : null}
            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : people.length === 0 ? (
            <EmptyState
              icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
              title="No people yet"
              body="Save sellers and buyers you deal with often, then pick them on Buy and Sell."
            />
          ) : (
            <EmptyState title="No matching people" body="Try a different name, phone, or address." />
          )
        }
        renderItem={({ item }) => <PersonRow person={item} />}
      />

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          label="Add person"
          icon={{ ios: 'plus', android: 'add', web: 'add' }}
          onPress={() => router.push('/home/people/new')}
        />
      </View>
    </Screen>
  );
}

function PersonRow({ person }: { person: Person }) {
  const { colors } = useAppTheme();
  const typeLabel = PERSON_TYPE_LABELS[person.personType];
  const details = [person.phone, person.address].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${person.name}, ${typeLabel}`}
      accessibilityHint="Opens the person to edit"
      onPress={() => router.push({ pathname: '/home/people/[id]', params: { id: person.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
          {person.name}
        </Text>
        <StatusBadge label={typeLabel} tone="neutral" />
        {details ? (
          <Text numberOfLines={1} style={[styles.rowDetails, { color: colors.muted }]}>
            {details}
          </Text>
        ) : null}
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
    padding: SPACE_MD,
    flexGrow: 1,
  },
  header: {
    gap: SPACE_SM,
    paddingBottom: SPACE_SM,
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
  rowTitle: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
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
