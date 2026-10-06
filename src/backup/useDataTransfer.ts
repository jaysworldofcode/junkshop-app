import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

import {
  getAutoBackupFolder,
  getLastAutoBackupAt,
  runAutoBackup,
  setAutoBackupFolder,
} from '@/backup/autoBackup';
import {
  pickBackupFolder,
  pickImportFile,
  readLatestBackup,
  shareExportFile,
  writeFileToFolder,
  writeLocalBackup,
  type BackupFile,
} from '@/backup/backupFiles';
import {
  buildExportPackage,
  countLocalRecords,
  getDeviceIdentity,
  hasImportedBefore,
  replaceAllData,
  validateAgainstSchema,
} from '@/backup/dataTransferRepository';
import { EXPORT_FILE_PREFIX, PRE_REPLACE_BACKUP_FILE_PREFIX, REPLACE_CONFIRMATION_PHRASE } from '@/constants/dataTransfer';
import { LATEST_SCHEMA_VERSION } from '@/db/migrate';
import {
  ExportPackageError,
  exportFileName,
  parseExportPackage,
  serializeExportPackage,
  totalRecords,
  type ExportPackage,
  type RecordCounts,
} from '@/domain/exportPackage';

export type PendingImport = {
  fileName: string;
  exportPackage: ExportPackage;
  isFromThisPhone: boolean;
  wasImportedBefore: boolean;
  isOlderSchema: boolean;
};

type Busy = 'export' | 'save' | 'import' | 'replace' | 'folder' | 'backup' | null;

export function useDataTransfer() {
  const database = useSQLiteContext();
  const [localCounts, setLocalCounts] = useState<RecordCounts | null>(null);
  const [folderUri, setFolderUri] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const applyStatus = useCallback(({ counts, folder, lastAt }: TransferStatus) => {
    setLocalCounts(counts);
    setFolderUri(folder);
    setLastBackupAt(lastAt);
  }, []);

  const refresh = useCallback(async () => {
    applyStatus(await loadTransferStatus(database));
  }, [applyStatus, database]);

  useEffect(() => {
    let isCancelled = false;

    loadTransferStatus(database)
      .then((status) => {
        if (!isCancelled) {
          applyStatus(status);
        }
      })
      .catch((loadError: unknown) => {
        if (!isCancelled) {
          setError(messageOf(loadError, 'Could not read the local data.'));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [applyStatus, database]);

  const run = useCallback(async (kind: Exclude<Busy, null>, task: () => Promise<string | null>, fallback: string) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      const message = await task();
      if (message) {
        setNotice(message);
      }
    } catch (taskError) {
      setError(messageOf(taskError, fallback));
    } finally {
      setBusy(null);
    }
  }, []);

  const exportAndShare = useCallback(
    () =>
      run(
        'export',
        async () => {
          const exportPackage = await buildExportPackage(database);
          await shareExportFile(serializeExportPackage(exportPackage), exportFileName(EXPORT_FILE_PREFIX, new Date()));
          return null;
        },
        'Could not export the data.'
      ),
    [database, run]
  );

  const exportToFolder = useCallback(
    () =>
      run(
        'save',
        async () => {
          const folder = await pickBackupFolder();
          if (!folder) {
            return null;
          }
          const exportPackage = await buildExportPackage(database);
          const fileName = exportFileName(EXPORT_FILE_PREFIX, new Date());
          writeFileToFolder(folder, fileName, serializeExportPackage(exportPackage));
          return `Saved ${fileName}.`;
        },
        'Could not save the export.'
      ),
    [database, run]
  );

  const preparePreview = useCallback(
    async (file: BackupFile) => {
      const exportPackage = parseExportPackage(file.text, LATEST_SCHEMA_VERSION);
      await validateAgainstSchema(database, exportPackage);
      const identity = await getDeviceIdentity(database);
      setConfirmation('');
      setPendingImport({
        fileName: file.name,
        exportPackage,
        isFromThisPhone: exportPackage.manifest.deviceId === identity.deviceId,
        wasImportedBefore: await hasImportedBefore(database, exportPackage.manifest.exportId),
        isOlderSchema: exportPackage.manifest.schemaVersion < LATEST_SCHEMA_VERSION,
      });
    },
    [database]
  );

  const chooseImportFile = useCallback(
    () =>
      run(
        'import',
        async () => {
          const file = await pickImportFile();
          if (file) {
            await preparePreview(file);
          }
          return null;
        },
        'Could not read that file.'
      ),
    [preparePreview, run]
  );

  const restoreFromFolder = useCallback(
    () =>
      run(
        'import',
        async () => {
          const folder = await pickBackupFolder();
          if (!folder) {
            return null;
          }
          const latest = await readLatestBackup(folder);
          if (!latest) {
            throw new ExportPackageError(
              'No automatic backups were found in that folder. Pick the folder that holds the junkshop-autobackup files, or use Import from file.'
            );
          }
          await setAutoBackupFolder(folder);
          setFolderUri(folder);
          await preparePreview(latest);
          return null;
        },
        'Could not read the backup folder.'
      ),
    [preparePreview, run]
  );

  const cancelImport = useCallback(() => {
    setPendingImport(null);
    setConfirmation('');
  }, []);

  const hasLocalData = localCounts ? totalRecords(localCounts) > 0 : false;
  const isConfirmed = !hasLocalData || confirmation.trim() === REPLACE_CONFIRMATION_PHRASE;

  const confirmReplace = useCallback(
    () =>
      run(
        'replace',
        async () => {
          if (!pendingImport || !isConfirmed) {
            return null;
          }
          if (hasLocalData) {
            const current = await buildExportPackage(database);
            writeLocalBackup(
              exportFileName(PRE_REPLACE_BACKUP_FILE_PREFIX, new Date()),
              PRE_REPLACE_BACKUP_FILE_PREFIX,
              serializeExportPackage(current)
            );
          }
          await replaceAllData(database, pendingImport.exportPackage);
          setPendingImport(null);
          setConfirmation('');
          await runAutoBackup(database).catch(() => 'off');
          await refresh();
          const total = totalRecords(pendingImport.exportPackage.manifest.recordCounts);
          return `Imported ${total} record${total === 1 ? '' : 's'}. This phone now has the same data as the export.`;
        },
        'Import failed. Nothing was changed.'
      ),
    [database, hasLocalData, isConfirmed, pendingImport, refresh, run]
  );

  const chooseBackupFolder = useCallback(
    () =>
      run(
        'folder',
        async () => {
          const folder = await pickBackupFolder();
          if (!folder) {
            return null;
          }
          await setAutoBackupFolder(folder);
          await runAutoBackup(database);
          await refresh();
          return 'Automatic backup is on. A copy is saved to this folder whenever you leave the app.';
        },
        'Could not use that folder. Pick a folder in phone storage, such as Documents.'
      ),
    [database, refresh, run]
  );

  const backUpNow = useCallback(
    () =>
      run(
        'backup',
        async () => {
          const result = await runAutoBackup(database);
          await refresh();
          return result === 'unchanged' ? 'The latest backup already has all your data.' : 'Backup saved.';
        },
        'Backup failed. The folder may have been moved or deleted. Choose the folder again.'
      ),
    [database, refresh, run]
  );

  const turnOffBackupFolder = useCallback(
    () =>
      run(
        'folder',
        async () => {
          await setAutoBackupFolder(null);
          await refresh();
          return 'Automatic backup is off. Existing backup files were left in the folder.';
        },
        'Could not turn off automatic backup.'
      ),
    [refresh, run]
  );

  return {
    localCounts,
    folderUri,
    lastBackupAt,
    pendingImport,
    confirmation,
    isConfirmed,
    busy,
    error,
    notice,
    setConfirmation,
    dismissNotice: () => setNotice(null),
    exportAndShare,
    exportToFolder,
    chooseImportFile,
    restoreFromFolder,
    cancelImport,
    confirmReplace,
    chooseBackupFolder,
    backUpNow,
    turnOffBackupFolder,
  };
}

type TransferStatus = {
  counts: RecordCounts;
  folder: string | null;
  lastAt: string | null;
};

async function loadTransferStatus(database: SQLiteDatabase): Promise<TransferStatus> {
  const [counts, folder, lastAt] = await Promise.all([
    countLocalRecords(database),
    getAutoBackupFolder(),
    getLastAutoBackupAt(),
  ]);
  return { counts, folder, lastAt };
}

/** File and storage errors from native code are not readable, so only validation messages are shown as-is. */
function messageOf(error: unknown, fallback: string): string {
  if (error instanceof ExportPackageError) {
    return error.message;
  }
  console.warn(fallback, error);
  return fallback;
}
