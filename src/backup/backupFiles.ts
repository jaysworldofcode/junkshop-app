import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  AUTO_BACKUP_FILE_PREFIX,
  AUTO_BACKUPS_TO_KEEP,
  EXPORT_MIME_TYPE,
  EXPORT_UTI,
  LOCAL_BACKUP_DIRECTORY,
} from '@/constants/dataTransfer';
import { isBackupFileName } from '@/domain/exportPackage';

export type BackupFile = {
  name: string;
  text: string;
};

/** Android only: a folder picked through the system picker stays writable and survives uninstalling the app. */
export const supportsBackupFolder = Platform.OS === 'android';

export async function shareExportFile(text: string, fileName: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.write(text);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this phone.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: EXPORT_MIME_TYPE, UTI: EXPORT_UTI, dialogTitle: 'Send Junkshop data' });
}

/** Null when the user closes the picker. */
export async function pickImportFile(): Promise<BackupFile | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['*/*'] });
  if (picked.canceled) {
    return null;
  }
  return { name: picked.result.name, text: await picked.result.text() };
}

/** Null when the user closes the picker. */
export async function pickBackupFolder(): Promise<string | null> {
  try {
    const directory = await Directory.pickDirectoryAsync();
    return directory.uri;
  } catch {
    return null;
  }
}

export function writeFileToFolder(folderUri: string, fileName: string, text: string): void {
  const file = new Directory(folderUri).createFile(fileName, EXPORT_MIME_TYPE);
  file.write(text);
}

/**
 * Writes a new file each time instead of overwriting one: some Android storage
 * providers do not truncate on write, which would leave a damaged file behind.
 */
export function writeAutoBackup(folderUri: string, fileName: string, text: string): void {
  writeFileToFolder(folderUri, fileName, text);
  pruneBackups(new Directory(folderUri), AUTO_BACKUP_FILE_PREFIX, AUTO_BACKUPS_TO_KEEP);
}

export async function readLatestBackup(folderUri: string): Promise<BackupFile | null> {
  const [latest] = backupFilesNewestFirst(new Directory(folderUri), AUTO_BACKUP_FILE_PREFIX);
  return latest ? { name: latest.name, text: await latest.text() } : null;
}

/** Keeps a copy inside the app before a Replace. It is lost if the app is uninstalled. */
export function writeLocalBackup(fileName: string, prefix: string, text: string): void {
  const directory = new Directory(Paths.document, LOCAL_BACKUP_DIRECTORY);
  if (!directory.exists) {
    directory.create({ intermediates: true });
  }
  new File(directory, fileName).write(text);
  pruneBackups(directory, prefix, AUTO_BACKUPS_TO_KEEP);
}

/** "Documents/Junkshop" from a picked folder's content URI. */
export function folderLabel(folderUri: string): string {
  const treeId = decodeURIComponent(folderUri.split('/tree/')[1] ?? folderUri);
  const [volume, path] = treeId.split(':');
  if (path === undefined) {
    return treeId;
  }
  return path === '' ? (volume === 'primary' ? 'Phone storage' : volume) : path;
}

function backupFilesNewestFirst(directory: Directory, prefix: string): File[] {
  return directory
    .list()
    .filter((entry): entry is File => entry instanceof File && isBackupFileName(entry.name, prefix))
    .sort((first, second) => second.name.localeCompare(first.name));
}

function pruneBackups(directory: Directory, prefix: string, keep: number): void {
  for (const stale of backupFilesNewestFirst(directory, prefix).slice(keep)) {
    stale.delete();
  }
}
