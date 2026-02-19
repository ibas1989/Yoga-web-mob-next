import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getStudents, getSessions, getSettings, saveSettings } from './storage';
import { Student, Session, AppSettings } from '@shared/types';

export interface BackupData {
  version: string;
  timestamp: string;
  students: Student[];
  sessions: Session[];
  settings: AppSettings;
}

export interface BackupStats {
  students: number;
  sessions: number;
}

// Generate backup data
export const generateBackup = async (): Promise<BackupData> => {
  const students = await getStudents();
  const sessions = await getSessions();
  const settings = await getSettings();

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    students,
    sessions,
    settings,
  };
};

// Format date and time as DD-MM-YYYY_HH-MM-SS
const formatBackupDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
};

// Export backup to file (Downloads folder or user-selected location)
export const exportBackupToFile = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const backup = await generateBackup();
    const filename = `${formatBackupDateTime(new Date())}_Yoga_Backup.json`;
    
    // Save to device's cache directory first
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backup, null, 2),
      { encoding: 'utf8' }
    );

    // Share/Save the file
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Yoga Tracker Backup',
        UTI: 'public.json',
      });
      
      return {
        success: true,
        message: 'Backup exported successfully! You can now save it to your preferred location.',
      };
    } else {
      return {
        success: false,
        message: 'Sharing not available on this device',
      };
    }
  } catch (error) {
    console.error('Export backup error:', error);
    return {
      success: false,
      message: `Failed to export backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Import backup from file picker
export const importBackupFromFile = async (): Promise<{ success: boolean; message: string; data?: BackupData }> => {
  try {
    // Pick a file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        message: 'File selection cancelled',
      };
    }

    const fileUri = result.assets[0].uri;
    
    // Read the file
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'utf8',
    });

    // Parse the backup
    const backup: BackupData = JSON.parse(fileContent);

    // Validate backup structure
    const validation = validateBackup(backup);
    if (!validation.valid) {
      return {
        success: false,
        message: `Invalid backup file: ${validation.issues.join(', ')}`,
      };
    }

    return {
      success: true,
      message: 'Backup file loaded successfully',
      data: backup,
    };
  } catch (error) {
    console.error('Import backup error:', error);
    return {
      success: false,
      message: `Failed to import backup: ${error instanceof Error ? error.message : 'Invalid file or format'}`,
    };
  }
};

// Validate backup data
export const validateBackup = (backup: any): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (!backup.version) {
    issues.push('Missing version');
  }

  if (!backup.timestamp) {
    issues.push('Missing timestamp');
  }

  if (!Array.isArray(backup.students)) {
    issues.push('Invalid students data');
  }

  if (!Array.isArray(backup.sessions)) {
    issues.push('Invalid sessions data');
  }

  if (!backup.settings || typeof backup.settings !== 'object') {
    issues.push('Invalid settings data');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

// Restore backup data to storage
export const restoreBackup = async (backup: BackupData): Promise<{ success: boolean; message: string }> => {
  try {
    // Store students
    await AsyncStorage.setItem('yoga_tracker_students', JSON.stringify(backup.students));
    
    // Store sessions
    await AsyncStorage.setItem('yoga_tracker_sessions', JSON.stringify(backup.sessions));
    
    // Store settings
    await saveSettings(backup.settings);

    return {
      success: true,
      message: 'Backup restored successfully!',
    };
  } catch (error) {
    console.error('Restore backup error:', error);
    return {
      success: false,
      message: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Get backup statistics
export const getBackupStats = async (): Promise<BackupStats> => {
  try {
    const students = await getStudents();
    const sessions = await getSessions();

    return {
      students: students.length,
      sessions: sessions.length,
    };
  } catch (error) {
    console.error('Get backup stats error:', error);
    return {
      students: 0,
      sessions: 0,
    };
  }
};

