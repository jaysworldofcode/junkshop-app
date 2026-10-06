import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { folderLabel, supportsBackupFolder } from '@/backup/backupFiles';
import { useDataTransfer, type PendingImport } from '@/backup/useDataTransfer';
import { DetailRow } from '@/components/DetailRow';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { SuccessNotice } from '@/components/SuccessNotice';
import { WarningNotice } from '@/components/WarningNotice';
import { EXPORT_TABLES, EXPORT_TABLE_LABELS, REPLACE_CONFIRMATION_PHRASE } from '@/constants/dataTransfer';
import { FONT_SIZE_BODY, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { totalRecords } from '@/domain/exportPackage';
import { formatTimestampLabel } from '@/domain/localDate';
import { useAppTheme } from '@/theme/useAppTheme';

export default function DataScreen() {
  const { colors, colorScheme } = useAppTheme();
  const transfer = useDataTransfer();
  const { localCounts, folderUri, lastBackupAt, pendingImport, busy } = transfer;
  const isBusy = busy !== null;
  const hasLocalData = localCounts ? totalRecords(localCounts) > 0 : false;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
      >
        {transfer.error ? <ErrorBanner message={transfer.error} /> : null}
        {transfer.notice ? (
          <SuccessNotice title="Done" body={transfer.notice} onDismiss={transfer.dismissNotice} />
        ) : null}

        {pendingImport ? (
          <ImportPreview
            pendingImport={pendingImport}
            hasLocalData={hasLocalData}
            confirmation={transfer.confirmation}
            isConfirmed={transfer.isConfirmed}
            isReplacing={busy === 'replace'}
            onChangeConfirmation={transfer.setConfirmation}
            onConfirm={() => void transfer.confirmReplace()}
            onCancel={transfer.cancelImport}
          />
        ) : null}

        {supportsBackupFolder ? (
          <SectionCard
            title="Automatic backup"
            description="Uninstalling the app deletes its data. A backup folder in phone storage is kept, so you can restore after reinstalling."
          >
            {folderUri ? (
              <>
                <DetailRow label="Folder" value={folderLabel(folderUri)} />
                <DetailRow label="Last backup" value={lastBackupAt ? formatTimestampLabel(lastBackupAt) : 'Not yet'} />
                <PrimaryButton
                  label="Back up now"
                  icon={{ ios: 'arrow.clockwise', android: 'backup', web: 'backup' }}
                  isLoading={busy === 'backup'}
                  disabled={isBusy}
                  onPress={() => void transfer.backUpNow()}
                />
                <PrimaryButton
                  label="Change folder"
                  variant="outline"
                  disabled={isBusy}
                  onPress={() => void transfer.chooseBackupFolder()}
                />
                <PrimaryButton
                  label="Turn off"
                  variant="outline"
                  disabled={isBusy}
                  onPress={() => void transfer.turnOffBackupFolder()}
                />
              </>
            ) : (
              <>
                <Text style={[styles.body, { color: colors.text }]}>
                  Pick or create a folder such as Documents/Junkshop. The app saves a copy there every time you leave
                  it and keeps the latest five.
                </Text>
                <PrimaryButton
                  label="Choose backup folder"
                  icon={{ ios: 'folder.fill', android: 'create_new_folder', web: 'create_new_folder' }}
                  isLoading={busy === 'folder'}
                  disabled={isBusy}
                  onPress={() => void transfer.chooseBackupFolder()}
                />
              </>
            )}
            <PrimaryButton
              label="Restore from backup folder"
              variant="outline"
              icon={{ ios: 'arrow.uturn.backward', android: 'settings_backup_restore', web: 'settings_backup_restore' }}
              disabled={isBusy}
              onPress={() => void transfer.restoreFromFolder()}
            />
          </SectionCard>
        ) : Platform.OS === 'ios' ? (
          <WarningNotice
            title="Keep a copy outside the app"
            body="Deleting the app deletes its data. Export regularly and save the file to Files or iCloud Drive, then import it after reinstalling."
          />
        ) : null}

        <SectionCard
          title="Export"
          description="Saves every product, price, purchase, sale, and expense into one file. Send it to another phone with Nearby Share, Bluetooth, messaging, or a cable."
        >
          {localCounts ? <DetailRow label="Records on this phone" value={String(totalRecords(localCounts))} /> : null}
          <PrimaryButton
            label="Export and send"
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'download' }}
            isLoading={busy === 'export'}
            disabled={isBusy}
            onPress={() => void transfer.exportAndShare()}
          />
          {supportsBackupFolder ? (
            <PrimaryButton
              label="Save export to a folder"
              variant="outline"
              icon={{ ios: 'folder', android: 'save', web: 'save' }}
              isLoading={busy === 'save'}
              disabled={isBusy}
              onPress={() => void transfer.exportToFolder()}
            />
          ) : null}
        </SectionCard>

        <SectionCard
          title="Import"
          description="Opens an export file from another phone. You see what is inside before anything changes."
        >
          <PrimaryButton
            label="Import from file"
            icon={{ ios: 'square.and.arrow.down', android: 'file_open', web: 'upload_file' }}
            isLoading={busy === 'import'}
            disabled={isBusy}
            onPress={() => void transfer.chooseImportFile()}
          />
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

type ImportPreviewProps = {
  pendingImport: PendingImport;
  hasLocalData: boolean;
  confirmation: string;
  isConfirmed: boolean;
  isReplacing: boolean;
  onChangeConfirmation: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function ImportPreview({
  pendingImport,
  hasLocalData,
  confirmation,
  isConfirmed,
  isReplacing,
  onChangeConfirmation,
  onConfirm,
  onCancel,
}: ImportPreviewProps) {
  const { manifest } = pendingImport.exportPackage;

  return (
    <SectionCard title="Ready to import" description={pendingImport.fileName}>
      <DetailRow label="From phone" value={manifest.deviceName ?? 'Unknown phone'} />
      <DetailRow label="Exported" value={formatTimestampLabel(manifest.exportedAt)} />
      <DetailRow label="App version" value={manifest.appVersion ?? 'Unknown'} />
      {EXPORT_TABLES.map((table) => (
        <DetailRow key={table} label={EXPORT_TABLE_LABELS[table]} value={String(manifest.recordCounts[table])} />
      ))}

      {pendingImport.wasImportedBefore ? (
        <WarningNotice title="Already imported" body="This exact export was imported on this phone before." />
      ) : null}
      {pendingImport.isFromThisPhone ? (
        <WarningNotice title="Made on this phone" body="This export came from this phone, not another one." />
      ) : null}
      {pendingImport.isOlderSchema ? (
        <WarningNotice
          title="Older app version"
          body="This export was made by an older version of the app. Fields added since then get their default values."
        />
      ) : null}

      {hasLocalData ? (
        <WarningNotice
          title="Replace all data"
          body="Everything on this phone is deleted and replaced with the export. A copy of the current data is saved inside the app first."
        >
          <FormField
            label={`Type ${REPLACE_CONFIRMATION_PHRASE} to confirm`}
            value={confirmation}
            onChangeText={onChangeConfirmation}
            placeholder={REPLACE_CONFIRMATION_PHRASE}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </WarningNotice>
      ) : null}

      <PrimaryButton
        label={hasLocalData ? 'Replace current data' : 'Import data'}
        icon={{ ios: 'arrow.down.doc.fill', android: 'download', web: 'download' }}
        isLoading={isReplacing}
        disabled={!isConfirmed}
        onPress={onConfirm}
      />
      <PrimaryButton label="Cancel" variant="outline" disabled={isReplacing} onPress={onCancel} />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG * 2,
  },
  body: {
    fontSize: FONT_SIZE_BODY - 1,
    lineHeight: 21,
  },
});
