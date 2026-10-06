import { useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

import { supportsBackupFolder, writeAutoBackup } from '@/backup/backupFiles';
import { buildExportPackage, dataFingerprint } from '@/backup/dataTransferRepository';
import { AUTO_BACKUP_FILE_PREFIX } from '@/constants/dataTransfer';
import { AUTO_BACKUP_FOLDER_KEY, AUTO_BACKUP_LAST_AT_KEY } from '@/constants/storage';
import { exportFileName, serializeExportPackage } from '@/domain/exportPackage';
import { nowIso } from '@/domain/timestamps';

export type AutoBackupResult = 'written' | 'unchanged' | 'off';

let lastFingerprint: string | null = null;
let running: Promise<AutoBackupResult> | null = null;

export async function getAutoBackupFolder(): Promise<string | null> {
  return supportsBackupFolder ? AsyncStorage.getItem(AUTO_BACKUP_FOLDER_KEY) : null;
}

export async function setAutoBackupFolder(folderUri: string | null): Promise<void> {
  lastFingerprint = null;
  if (folderUri) {
    await AsyncStorage.setItem(AUTO_BACKUP_FOLDER_KEY, folderUri);
  } else {
    await AsyncStorage.multiRemove([AUTO_BACKUP_FOLDER_KEY, AUTO_BACKUP_LAST_AT_KEY]);
  }
}

export async function getLastAutoBackupAt(): Promise<string | null> {
  return AsyncStorage.getItem(AUTO_BACKUP_LAST_AT_KEY);
}

/** Writes a backup into the chosen folder when the data changed since the last one. */
export function runAutoBackup(database: SQLiteDatabase): Promise<AutoBackupResult> {
  running ??= backUpIfChanged(database).finally(() => {
    running = null;
  });
  return running;
}

async function backUpIfChanged(database: SQLiteDatabase): Promise<AutoBackupResult> {
  const folderUri = await getAutoBackupFolder();
  if (!folderUri) {
    return 'off';
  }

  const fingerprint = await dataFingerprint(database);
  if (fingerprint === lastFingerprint) {
    return 'unchanged';
  }

  const exportPackage = await buildExportPackage(database);
  writeAutoBackup(folderUri, exportFileName(AUTO_BACKUP_FILE_PREFIX, new Date()), serializeExportPackage(exportPackage));
  lastFingerprint = fingerprint;
  await AsyncStorage.setItem(AUTO_BACKUP_LAST_AT_KEY, nowIso());
  return 'written';
}

/** Backs up on launch and every time the app leaves the screen, which also covers swiping it away. */
export function useAutoBackup(): void {
  const database = useSQLiteContext();

  useEffect(() => {
    function backUp() {
      runAutoBackup(database).catch((error: unknown) => {
        console.warn('Automatic backup failed', error);
      });
    }

    backUp();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backUp();
      }
    });
    return () => subscription.remove();
  }, [database]);
}
