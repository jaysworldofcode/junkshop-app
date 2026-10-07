import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SearchField } from '@/components/SearchField';
import { StatusBadge } from '@/components/StatusBadge';
import {
  BUTTON_MIN_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  FONT_SIZE_TITLE,
  HIT_SLOP,
  ICON_SIZE_MD,
  MAX_CONTENT_WIDTH,
  RADIUS_LG,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { PERSON_TYPE_LABELS, type TicketRole } from '@/constants/person';
import { matchesPersonSearch, personFitsRole, type Person } from '@/domain/person';
import { useAppTheme } from '@/theme/useAppTheme';

type PersonPickerModalProps = {
  visible: boolean;
  role: TicketRole;
  people: Person[];
  selectedId: string | null;
  onSelect: (person: Person) => void;
  onClose: () => void;
};

const ROLE_COPY: Record<TicketRole, { title: string; emptyBody: string }> = {
  seller: {
    title: 'Pick a seller',
    emptyBody: 'Add people with the Seller or Seller & buyer type under People on Home.',
  },
  buyer: {
    title: 'Pick a buyer',
    emptyBody: 'Add people with the Buyer or Seller & buyer type under People on Home.',
  },
};

export function PersonPickerModal({ visible, role, people, selectedId, onSelect, onClose }: PersonPickerModalProps) {
  const { colors, colorScheme } = useAppTheme();
  const [search, setSearch] = useState('');
  const copy = ROLE_COPY[role];

  const fitting = useMemo(() => people.filter((person) => personFitsRole(person, role)), [people, role]);
  const filtered = useMemo(() => fitting.filter((person) => matchesPersonSearch(person, search)), [fitting, search]);

  const close = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {copy.title}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={HIT_SLOP} onPress={close}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor={colors.text}
                size={ICON_SIZE_MD}
              />
            </Pressable>
          </View>

          {fitting.length > 0 ? (
            <SearchField value={search} onChangeText={setSearch} placeholder="Search name, phone, or address" />
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              fitting.length === 0 ? (
                <View style={styles.emptyBox}>
                  <EmptyState
                    icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
                    title="No saved people"
                    body={copy.emptyBody}
                  />
                  <PrimaryButton
                    label="Go to People"
                    variant="outline"
                    onPress={() => {
                      close();
                      router.navigate('/home/people');
                    }}
                  />
                </View>
              ) : (
                <EmptyState title="No matching people" body="Try a different name, phone, or address." />
              )
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              const details = [item.phone, item.address].filter(Boolean).join(' Â· ');

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setSearch('');
                    onSelect(item);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
                    {details ? (
                      <Text numberOfLines={1} style={[styles.optionDetails, { color: colors.muted }]}>
                        {details}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge label={PERSON_TYPE_LABELS[item.personType]} tone="neutral" />
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    padding: SPACE_MD,
    gap: SPACE_MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
  },
  list: {
    gap: SPACE_SM,
    paddingBottom: SPACE_MD,
    flexGrow: 1,
  },
  emptyBox: {
    gap: SPACE_MD,
  },
  option: {
    minHeight: BUTTON_MIN_HEIGHT + SPACE_MD,
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  optionCopy: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  optionName: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  optionDetails: {
    fontSize: FONT_SIZE_CAPTION,
  },
});
