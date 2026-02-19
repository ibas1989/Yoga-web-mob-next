import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import { getSettings, saveSettings } from '../../src/lib/storage';
import { AppSettings } from '@shared/types';
import {  
  exportBackupToFile, 
  importBackupFromFile, 
  restoreBackup
} from '../../src/lib/backup';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'settings' | 'backup'>('settings');
  const [defaultTeamCharge, setDefaultTeamCharge] = useState('1');
  const [defaultIndividualCharge, setDefaultIndividualCharge] = useState('2');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Disable swipe back gesture on this tab screen
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  // Track changes
  useEffect(() => {
    checkForChanges();
  }, [defaultTeamCharge, defaultIndividualCharge, goals]);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setDefaultTeamCharge((settings.defaultTeamSessionCharge ?? 1).toString());
      setDefaultIndividualCharge((settings.defaultIndividualSessionCharge ?? 2).toString());
      setGoals(settings.availableGoals || []);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkForChanges = async () => {
    try {
      const settings = await getSettings();
      const currentTeamCharge = parseInt(defaultTeamCharge);
      const currentIndividualCharge = parseInt(defaultIndividualCharge);
      
      const hasChanges = 
        currentTeamCharge !== settings.defaultTeamSessionCharge ||
        currentIndividualCharge !== settings.defaultIndividualSessionCharge ||
        JSON.stringify(goals) !== JSON.stringify(settings.availableGoals);
      
      setHasUnsavedChanges(hasChanges);
    } catch (error) {
      console.error('Error checking changes:', error);
    }
  };

  const handleSave = async () => {
    try {
      const teamCharge = parseInt(defaultTeamCharge);
      const individualCharge = parseInt(defaultIndividualCharge);
      
      if (isNaN(teamCharge) || teamCharge < 1) {
        Alert.alert(
          t('common.error'),
          t('settings.teamChargeValidation')
        );
        return;
      }
      
      if (isNaN(individualCharge) || individualCharge < 1) {
        Alert.alert(
          t('common.error'),
          t('settings.individualChargeValidation')
        );
        return;
      }
      
      const settings: AppSettings = {
        defaultTeamSessionCharge: teamCharge,
        defaultIndividualSessionCharge: individualCharge,
        availableGoals: goals,
      };
      
      await saveSettings(settings);
      setHasUnsavedChanges(false);
      
      Alert.alert(
        t('common.success'),
        t('settings.settingsSaved')
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        t('common.error'),
        'Failed to save settings'
      );
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) {
      Alert.alert(
        t('common.error'),
        t('settings.enterGoalName')
      );
      return;
    }
    
    if (goals.includes(newGoal.trim())) {
      Alert.alert(
        t('common.error'),
        t('settings.goalExists')
      );
      return;
    }
    
    setGoals([...goals, newGoal.trim()]);
    setNewGoal('');
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    Alert.alert(
      t('settings.removeGoal'),
      `Remove "${goalToRemove}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.remove'), 
          style: 'destructive',
          onPress: () => setGoals(goals.filter(g => g !== goalToRemove))
        }
      ]
    );
  };

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Handle export backup to file
  const handleExportBackup = async () => {
    try {
      const result = await exportBackupToFile();
      if (result.success) {
        Alert.alert(t('common.success'), result.message);
      } else {
        Alert.alert(t('common.error'), result.message);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to export backup');
    }
  };

  // Handle import backup from file
  const handleImportBackup = async () => {
    try {
      const result = await importBackupFromFile();
      
      if (!result.success) {
        if (result.message !== 'File selection cancelled') {
          Alert.alert(t('common.error'), result.message);
        }
        return;
      }

      if (result.data) {
        // Confirm before restoring
        Alert.alert(
          'Restore Backup',
          `This will replace all current data with:\n• ${result.data.students.length} students\n• ${result.data.sessions.length} sessions\n\nContinue?`,
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                const restoreResult = await restoreBackup(result.data!);
                if (restoreResult.success) {
                  Alert.alert(t('common.success'), restoreResult.message);
                  await loadSettings();
                } else {
                  Alert.alert(t('common.error'), restoreResult.message);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to import backup');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        {hasUnsavedChanges && activeTab === 'settings' && (
          <View style={styles.unsavedBadge}>
            <View style={styles.unsavedDot} />
            <Text style={styles.unsavedText}>Unsaved</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            ⚙️ {t('settings.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'backup' && styles.tabActive]}
          onPress={() => setActiveTab('backup')}
        >
          <Text style={[styles.tabText, activeTab === 'backup' && styles.tabTextActive]}>
            💾 {t('settings.backup')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'settings' && (
          <>
        {/* Language Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌍</Text>
            <Text style={styles.sectionTitle}>Language / Язык</Text>
          </View>
          <Text style={styles.sectionDescription}>Choose your preferred language</Text>
          
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                currentLanguage === 'en' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[
                styles.languageButtonText,
                currentLanguage === 'en' && styles.languageButtonTextActive
              ]}>
                🇺🇸 English
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageButton,
                currentLanguage === 'ru' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('ru')}
            >
              <Text style={[
                styles.languageButtonText,
                currentLanguage === 'ru' && styles.languageButtonTextActive
              ]}>
                🇷🇺 Русский
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Session Pricing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💵</Text>
            <Text style={styles.sectionTitle}>{t('settings.defaultSessionCharges')}</Text>
          </View>
          
          {/* Team Sessions */}
          <View style={[styles.card, styles.teamCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>👥</Text>
              <Text style={styles.cardTitle}>{t('settings.teamSessions')}</Text>
            </View>
            <Text style={styles.cardDescription}>
              {t('settings.defaultSessionChargeTeam')}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('settings.sessionCharge')}</Text>
              <TextInput
                style={styles.input}
                value={defaultTeamCharge}
                onChangeText={setDefaultTeamCharge}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.infoBox, styles.teamInfoBox]}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Each student in a group session will be charged {defaultTeamCharge || '1'} {defaultTeamCharge === '1' ? 'session' : 'sessions'}.
              </Text>
            </View>
          </View>

          {/* Individual Sessions */}
          <View style={[styles.card, styles.individualCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>👤</Text>
              <Text style={styles.cardTitle}>{t('settings.individualSessions')}</Text>
            </View>
            <Text style={styles.cardDescription}>
              {t('settings.defaultSessionChargeIndividual')}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('settings.sessionCharge')}</Text>
              <TextInput
                style={styles.input}
                value={defaultIndividualCharge}
                onChangeText={setDefaultIndividualCharge}
                keyboardType="numeric"
                placeholder="2"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.infoBox, styles.individualInfoBox]}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                One-on-one sessions will deduct {defaultIndividualCharge || '2'} {defaultIndividualCharge === '1' ? 'session' : 'sessions'}.
              </Text>
            </View>
          </View>
        </View>

        {/* Goals Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>{t('settings.sessionGoalsTags')}</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Goals & Focus Areas</Text>
            <Text style={styles.cardDescription}>{t('settings.manageGoalsDescription')}</Text>
            
            {/* Add Goal Input */}
            <View style={styles.addGoalContainer}>
              <TextInput
                style={styles.goalInput}
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder={t('settings.enterNewGoal')}
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={handleAddGoal}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
                <Text style={styles.addButtonText}>➕ Add</Text>
              </TouchableOpacity>
            </View>

            {/* Goals List */}
            {goals.length > 0 ? (
              <View style={styles.goalsContainer}>
                <View style={styles.goalsHeader}>
                  <Text style={styles.goalsLabel}>{t('settings.availableGoals')}</Text>
                  <View style={styles.goalsBadge}>
                    <Text style={styles.goalsBadgeText}>{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</Text>
                  </View>
                </View>
                <View style={styles.goalsList}>
                  {goals.map((goal, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.goalTag}
                      onPress={() => handleRemoveGoal(goal)}
                    >
                      <Text style={styles.goalTagIcon}>🎯</Text>
                      <Text style={styles.goalTagText}>{goal}</Text>
                      <Text style={styles.goalTagRemove}>❌</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>No goals added yet</Text>
                <Text style={styles.emptySubtext}>Add your first goal above to get started</Text>
              </View>
            )}

            {/* Info Box */}
            <View style={[styles.infoBox, styles.goalsInfoBox]}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTextBold}>How goals work:</Text>
                <Text style={styles.infoTextSmall}>• Assign to students in their profile</Text>
                <Text style={styles.infoTextSmall}>• Track specific focus areas</Text>
                <Text style={styles.infoTextSmall}>• Tag sessions and monitor progress</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
          </>
        )}

        {activeTab === 'backup' && (
          <>
            {/* Export Backup */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📤</Text>
                <Text style={styles.sectionTitle}>Export Backup</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Save your data to a file on your device
              </Text>
              
              <TouchableOpacity
                style={[styles.card, { borderColor: '#4CAF50' }]}
                onPress={handleExportBackup}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>📤</Text>
                  <Text style={styles.cardTitle}>Export to File</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Creates a backup file and lets you save it to your preferred location (Files, iCloud, Downloads, etc.)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Import Backup */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📥</Text>
                <Text style={styles.sectionTitle}>Import Backup</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Restore your data from a backup file
              </Text>
              
              <TouchableOpacity
                style={[styles.card, { borderColor: '#2196F3' }]}
                onPress={handleImportBackup}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>📥</Text>
                  <Text style={styles.cardTitle}>Select Backup File</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Opens file picker to select your backup JSON file. After selection, you'll confirm before restoring.
                </Text>
              </TouchableOpacity>

              <View style={[styles.infoBox, { backgroundColor: '#FFF3CD', borderColor: '#FFD54F', marginTop: 16 }]}>
                <Text style={styles.infoIcon}>⚠️</Text>
                <Text style={styles.infoText}>
                  Warning: Restoring will replace ALL current data with the backup data. Make sure to export your current data first if you want to keep it.
                </Text>
              </View>
            </View>

            {/* How it works */}
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>ℹ️</Text>
                  <Text style={styles.cardTitle}>How Backup Works</Text>
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTextBold}>To Export:</Text>
                  <Text style={styles.infoTextSmall}>• Tap "Export to File" button</Text>
                  <Text style={styles.infoTextSmall}>• Choose where to save (Files app, iCloud Drive, etc.)</Text>
                  <Text style={styles.infoTextSmall}>• Backup saved as JSON file with timestamp</Text>
                  <Text style={styles.infoTextSmall}>• Remember the location for later restore</Text>
                  
                  <Text style={[styles.infoTextBold, { marginTop: 12 }]}>To Import:</Text>
                  <Text style={styles.infoTextSmall}>• Tap "Select Backup File" button</Text>
                  <Text style={styles.infoTextSmall}>• Browse to your saved backup file</Text>
                  <Text style={styles.infoTextSmall}>• Select the JSON file</Text>
                  <Text style={styles.infoTextSmall}>• Confirm restoration in the dialog</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>

      {/* Save Button */}
      {hasUnsavedChanges && activeTab === 'settings' && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 {t('settings.saveSettings')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 4,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  unsavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginRight: 6,
  },
  unsavedText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#4C7D2D',
    backgroundColor: '#F0F9E8',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#4C7D2D',
  },
  overviewCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#90CAF9',
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  overviewItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  overviewSubtext: {
    fontSize: 11,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  teamCard: {
    borderColor: '#A5D6A7',
  },
  individualCard: {
    borderColor: '#CE93D8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  teamInfoBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  individualInfoBox: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#CE93D8',
  },
  goalsInfoBox: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTextBold: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  infoTextSmall: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  addGoalContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  goalInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  goalsContainer: {
    marginTop: 8,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  goalsBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalsBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  goalsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#90CAF9',
  },
  goalTagIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  goalTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginRight: 6,
  },
  goalTagRemove: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
  },
  bottomSpacer: {
    height: 100,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButton: {
    backgroundColor: '#4C7D2D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

