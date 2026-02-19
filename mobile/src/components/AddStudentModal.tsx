import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Student } from '@shared/types';
import { saveStudent, getStudents, getSettings } from '../lib/storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onStudentAdded: (studentId: string) => void;
  existingStudentIds?: string[];
}

export function AddStudentModal({
  visible,
  onClose,
  onStudentAdded,
  existingStudentIds = [],
}: AddStudentModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Create form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) {
      loadData();
      resetForm();
      setMode('select');
    }
  }, [visible]);

  const loadData = async () => {
    const students = await getStudents();
    setAllStudents(students);

    const settings = await getSettings();
    setAvailableGoals(settings.availableGoals);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setInitialBalance('0');
    setSelectedGoals([]);
    setDescription('');
    setSearchTerm('');
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSelectExisting = (studentId: string) => {
    onStudentAdded(studentId);
    onClose();
  };

  const handleCreateStudent = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('validation.enterStudentName'));
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      balance: parseFloat(initialBalance) || 0,
      goals: selectedGoals,
      description: description.trim(),
      createdAt: new Date(),
      notes: [],
      balanceTransactions: [],
    };

    await saveStudent(newStudent);
    onStudentAdded(newStudent.id);
    onClose();
  };

  const availableStudents = allStudents.filter(
    (s) => !existingStudentIds.includes(s.id)
  );

  const filteredStudents = availableStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.flex} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('studentForm.addStudentToSession')}</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'select' && styles.tabActive]}
                onPress={() => setMode('select')}
              >
                <Text
                  style={[styles.tabText, mode === 'select' && styles.tabTextActive]}
                >
                  {t('studentForm.selectExisting')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'create' && styles.tabActive]}
                onPress={() => setMode('create')}
              >
                <Text
                  style={[styles.tabText, mode === 'create' && styles.tabTextActive]}
                >
                  {t('studentForm.createNew')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Mode Action Button */}
          {mode === 'create' && (
            <View style={styles.actionBar}>
              <TouchableOpacity 
                onPress={handleCreateStudent} 
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>
                  {t('studentForm.createAndAdd')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {mode === 'select' ? (
            <>
              {/* Search */}
              <TextInput
                style={styles.searchInput}
                placeholder={t('studentForm.searchByName')}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#999"
              />

              {/* Student List */}
              {filteredStudents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {searchTerm
                      ? t('studentForm.noStudentsFound')
                      : t('studentForm.noAvailableStudents')}
                  </Text>
                </View>
              ) : (
                filteredStudents.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={styles.studentCard}
                    onPress={() => handleSelectExisting(student.id)}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentBalance}>
                        {t('studentForm.currentBalance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                      </Text>
                    </View>
                    <View style={styles.addButton}>
                      <Text style={styles.addButtonText}>{t('studentForm.add')}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              {/* Create Form */}
              <View style={styles.form}>
                <Text style={styles.label}>{t('studentForm.nameRequired')}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('studentForm.namePlaceholder')}
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>{t('studentForm.phone')}</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('studentForm.phonePlaceholder')}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>{t('studentForm.initialBalance')}</Text>
                <TextInput
                  style={styles.input}
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>{t('studentForm.studentGoals')}</Text>
                <View style={styles.goalsContainer}>
                  {availableGoals.map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      style={[
                        styles.goalChip,
                        selectedGoals.includes(goal) && styles.goalChipSelected,
                      ]}
                      onPress={() => toggleGoal(goal)}
                    >
                      <Text
                        style={[
                          styles.goalChipText,
                          selectedGoals.includes(goal) &&
                            styles.goalChipTextSelected,
                        ]}
                      >
                        {goal}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>{t('studentForm.description')}</Text>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('studentForm.descriptionPlaceholder')}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    margin: 8,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  actionBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  createButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentBalance: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  goalChipSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  goalChipText: {
    fontSize: 12,
    color: '#666',
  },
  goalChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});

