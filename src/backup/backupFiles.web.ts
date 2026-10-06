import { EXPORT_MIME_TYPE } from '@/constants/dataTransfer';

export type BackupFile = {
  name: string;
  text: string;
};

/** Browsers cannot keep writing to a folder, so the web build only exports and imports files. */
export const supportsBackupFolder = false;

export async function shareExportFile(text: string, fileName: string): Promise<void> {
  downloadText(text, fileName);
}

export function pickImportFile(): Promise<BackupFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `${EXPORT_MIME_TYPE},.json`;
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      file.text().then((text) => resolve({ name: file.name, text }), reject);
    });
    input.click();
  });
}

export async function pickBackupFolder(): Promise<string | null> {
  return null;
}

export function writeFileToFolder(): void {
  throw new Error('Backup folders are not available on the web.');
}

export function writeAutoBackup(): void {
  throw new Error('Backup folders are not available on the web.');
}

export async function readLatestBackup(): Promise<BackupFile | null> {
  return null;
}

export function writeLocalBackup(fileName: string, _prefix: string, text: string): void {
  downloadText(text, fileName);
}

export function folderLabel(folderUri: string): string {
  return folderUri;
}

function downloadText(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: EXPORT_MIME_TYPE }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
