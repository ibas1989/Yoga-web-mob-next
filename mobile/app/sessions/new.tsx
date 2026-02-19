import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Session, Student } from '@shared/types';
import { getStudents, getSettings, saveSession } from '../../src/lib/storage';
import { formatDateForUrl, parseDateFromUrl } from '@shared/utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { AddStudentModal } from '../../src/components/AddStudentModal';

// Custom Picker Modal Component
function PickerModal({
  visible,
  options,
  selectedValue,
  onSelect,
  onClose,
  title,
}: {
  visible: boolean;
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  title: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  item.value === selectedValue && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    item.value === selectedValue && styles.modalOptionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function NewSessionScreen() {
  const { date: dateParam, time: timeParam, returnTo } = useLocalSearchParams<{
    date?: string;
    time?: string;
    returnTo?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [students, setStudents] = useState<Student[]>([]);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [defaultTeamCharge, setDefaultTeamCharge] = useState(1);
  const [defaultIndividualCharge, setDefaultIndividualCharge] = useState(2);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [sessionType, setSessionType] = useState<'team' | 'individual'>('team');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Track initial values for comparison (accounting for URL params)
  const [initialDate, setInitialDate] = useState<Date>(new Date());
  const [initialTime, setInitialTime] = useState('09:00');

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Time options - 30-minute intervals from 06:00 to 22:00
  const timeOptions = Array.from({ length: 33 }, (_, i) => {
    const hours = Math.floor(i / 2) + 6;
    const minutes = (i % 2) * 30;
    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return { value, label: value };
  });

  const durationOptions = [
    { value: '60', label: t('sessions.durationOptions.oneHour') },
    { value: '90', label: t('sessions.durationOptions.oneAndHalfHours') },
    { value: '120', label: t('sessions.durationOptions.twoHours') },
  ];

  const sessionTypeOptions = [
    { value: 'team', label: t('sessions.team') },
    { value: 'individual', label: t('sessions.individual') },
  ];

  useEffect(() => {
    loadData();

    let initialDateValue = new Date();
    let initialTimeValue = '09:00';

    if (dateParam) {
      const parsedDate = parseDateFromUrl(dateParam);
      setSelectedDate(parsedDate);
      initialDateValue = parsedDate;
    }
    if (timeParam) {
      setStartTime(timeParam);
      initialTimeValue = timeParam;
    }

    setInitialDate(initialDateValue);
    setInitialTime(initialTimeValue);
  }, [dateParam, timeParam]);

  const loadData = async () => {
    const loadedStudents = await getStudents();
    const settings = await getSettings();
    setStudents(loadedStudents);
    setAvailableGoals(settings.availableGoals);
    setDefaultTeamCharge(settings.defaultTeamSessionCharge ?? 1);
    setDefaultIndividualCharge(settings.defaultIndividualSessionCharge ?? 2);
  };

  const calculateEndTime = (start: string, durationMinutes: number): string => {
    const [hours, minutes] = start.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

    return `${endHours}:${endMinutes}`;
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleStudentAdded = async (studentId: string) => {
    // Reload students to get the newly added one
    const loadedStudents = await getStudents();
    setStudents(loadedStudents);
    
    // Auto-select the newly added student
    if (!selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Check if user has entered any data
  const hasUnsavedChanges = () => {
    // Check if date was changed from initial value
    const initialDateNormalized = new Date(initialDate);
    initialDateNormalized.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    const dateChanged = selectedDateNormalized.getTime() !== initialDateNormalized.getTime();
    
    // Check if time was changed from initial value
    const timeChanged = startTime !== initialTime;
    
    return (
      dateChanged ||
      timeChanged ||
      duration !== '60' ||
      sessionType !== 'team' ||
      selectedStudentIds.length > 0 ||
      selectedGoals.length > 0 ||
      notes.trim() !== ''
    );
  };

  // Handle back navigation with confirmation
  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        t('sessions.unsavedChanges'),
        t('sessions.unsavedChangesDescription'),
        [
          {
            text: t('sessions.no') || 'No',
            style: 'cancel',
          },
          {
            text: t('sessions.yes') || 'Yes',
            style: 'destructive',
            onPress: () => {
              if (returnTo) {
                router.push(returnTo as any);
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } else {
      if (returnTo) {
        router.push(returnTo as any);
      } else {
        router.back();
      }
    }
  };

  const handleSave = async () => {
    if (selectedStudentIds.length === 0) {
      Alert.alert(t('common.error'), t('sessions.pleaseSelectStudent'));
      return;
    }

    const endTime = calculateEndTime(startTime, parseInt(duration));

    const newSession: Session = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime,
      endTime,
      studentIds: selectedStudentIds,
      goals: selectedGoals,
      pricePerStudent:
        sessionType === 'individual' ? defaultIndividualCharge : defaultTeamCharge,
      status: 'scheduled',
      balanceEntries: {},
      notes,
      sessionType,
      createdAt: new Date(),
    };

    await saveSession(newSession);

    if (returnTo) {
      router.push(returnTo as any);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
          <Text style={styles.backButtonText}>← {t('sessions.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('sessions.newSession')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{t('sessions.create')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('sessions.sessionDate')}</Text>
          <Text style={styles.dateText}>{selectedDate.toLocaleDateString()}</Text>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('sessions.startTime')}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTimeModal(true)}
          >
            <Text style={styles.pickerButtonText}>{startTime}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('sessions.duration')}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDurationModal(true)}
          >
            <Text style={styles.pickerButtonText}>
              {durationOptions.find((o) => o.value === duration)?.label}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {t('sessions.endTime')}: {calculateEndTime(startTime, parseInt(duration))}
          </Text>
        </View>

        {/* Session Type */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('sessions.sessionType')}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={styles.pickerButtonText}>
              {sessionTypeOptions.find((o) => o.value === sessionType)?.label}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Students */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>{t('sessions.attendeesLabel')} ({selectedStudentIds.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddStudentModal(true)}
            >
              <Text style={styles.addButtonText}>{t('sessions.addStudentButton')}</Text>
            </TouchableOpacity>
          </View>
          {selectedStudentIds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('sessions.noAttendeesAddedYet')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {t('sessions.useAddStudentButton')}
              </Text>
            </View>
          ) : (
            students
              .filter((student) => selectedStudentIds.includes(student.id))
              .map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.attendeeRow}
                  onPress={() => toggleStudent(student.id)}
                >
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentBalance}>
                      {t('sessions.balance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => toggleStudent(student.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
          )}
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('sessions.sessionGoalsLabel')}</Text>
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
                    selectedGoals.includes(goal) && styles.goalChipTextSelected,
                  ]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('sessions.notesOptional')}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('sessions.addNotesPlaceholder')}
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <PickerModal
        visible={showTimeModal}
        options={timeOptions}
        selectedValue={startTime}
        onSelect={setStartTime}
        onClose={() => setShowTimeModal(false)}
        title={t('sessions.selectStartTime')}
      />

      <PickerModal
        visible={showDurationModal}
        options={durationOptions}
        selectedValue={duration}
        onSelect={setDuration}
        onClose={() => setShowDurationModal(false)}
        title={t('sessions.selectDuration')}
      />

      <PickerModal
        visible={showTypeModal}
        options={sessionTypeOptions}
        selectedValue={sessionType}
        onSelect={setSessionType as any}
        onClose={() => setShowTypeModal(false)}
        title={t('sessions.selectSessionType')}
      />

      <AddStudentModal
        visible={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onStudentAdded={handleStudentAdded}
        existingStudentIds={selectedStudentIds}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  attendeeInfo: {
    flex: 1,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  studentBalance: {
    fontSize: 12,
    color: '#666',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalOptionSelected: {
    backgroundColor: '#4f46e5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
});
