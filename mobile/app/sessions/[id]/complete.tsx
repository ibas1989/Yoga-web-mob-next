import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Session, Student } from '@shared/types';
import {
  getStudents,
  getSessions,
  getSettings,
  saveSession,
  addBalanceTransaction,
} from '../../../src/lib/storage';
import { useTranslation } from 'react-i18next';
import { AddStudentModal } from '../../../src/components/AddStudentModal';

export default function CompleteSessionScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [session, setSession] = useState<Session | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [sessionDeduction, setSessionDeduction] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const sessions = await getSessions();
      const foundSession = sessions.find((s) => s.id === id);

      if (foundSession && foundSession.status === 'scheduled') {
        setSession(foundSession);
        const students = await getStudents();
        setAllStudents(students);
        setSelectedStudentIds([...foundSession.studentIds]);

        const settings = await getSettings();
        const deduction =
          foundSession.sessionType === 'individual'
            ? settings.defaultIndividualSessionCharge
            : settings.defaultTeamSessionCharge;
        setSessionDeduction(deduction);
      } else {
        Alert.alert(t('sessionComplete.error'), t('sessionComplete.sessionNotFoundOrCompleted'));
        router.back();
      }
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert(t('sessionComplete.error'), t('sessionComplete.failedToLoadSession'));
    } finally {
      setIsLoading(false);
    }
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
    setAllStudents(loadedStudents);
    
    // Auto-select the newly added student
    if (!selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    }
  };

  const handleComplete = async () => {
    if (!session) return;

    if (selectedStudentIds.length === 0) {
      Alert.alert(t('sessionComplete.error'), t('sessionComplete.pleaseSelectAtLeastOneAttendee'));
      return;
    }

    // Complete the session
    const students = await getStudents();

    // Update student balances
    selectedStudentIds.forEach((studentId) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const reason = t('transactionDetails.sessionCompletedReason', {
        date: new Date(session.date).toLocaleDateString(),
        sessionType: session.sessionType === 'team' ? t('sessionDetails.team') : t('sessionDetails.individual')
      });
      addBalanceTransaction(studentId, -sessionDeduction, reason);
    });

    // Update session status
    session.studentIds = selectedStudentIds;
    session.status = 'completed';
    await saveSession(session);

    Alert.alert(t('sessionComplete.success'), t('sessionComplete.sessionCompletedSuccessfully'), [
      {
        text: t('sessionComplete.ok'),
        onPress: () => {
          if (returnTo) {
            router.push(returnTo as any);
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('calendarDay.loading')}</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backButtonText}>← {t('sessions.back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('sessionComplete.sessionNotFound')}</Text>
        </View>
      </View>
    );
  }

  const originalAttendees = allStudents.filter((s) =>
    session.studentIds.includes(s.id)
  );
  const addedStudents = allStudents.filter((s) =>
    selectedStudentIds.includes(s.id) && !session.studentIds.includes(s.id)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← {t('sessions.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity 
          onPress={handleComplete} 
          style={[
            styles.completeButtonHeader,
            selectedStudentIds.length === 0 && styles.completeButtonHeaderDisabled,
          ]}
          disabled={selectedStudentIds.length === 0}
        >
          <Text style={styles.completeButtonHeaderText}>{t('sessionComplete.completeSession')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('sessionComplete.completeSession')}</Text>
          <Text style={styles.infoText}>
            {t('sessionComplete.eachAttendeeDeducted', { 
              count: sessionDeduction, 
              sessionText: sessionDeduction === 1 ? t('common.session') : t('common.sessions') 
            })}
          </Text>
        </View>

        {/* Session Type */}
        <View style={styles.typeCard}>
          <Text style={styles.typeText}>
            {t('sessionComplete.sessionType')}: {session.sessionType === 'team' ? t('sessionDetails.team') : t('sessionDetails.individual')}
          </Text>
          <Text style={styles.typeSubtext}>
            {t('sessionComplete.eachAttendeeDeducted', { 
              count: sessionDeduction, 
              sessionText: sessionDeduction === 1 ? t('common.session') : t('common.sessions') 
            })}
          </Text>
        </View>

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sessionComplete.confirmAttendees')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('sessionComplete.uncheckAnyoneWhoDidntAttend')}
          </Text>

          {originalAttendees.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            const newBalance = student.balance - sessionDeduction;

            return (
              <TouchableOpacity
                key={student.id}
                style={[styles.studentCard, isSelected && styles.studentCardSelected]}
                onPress={() => toggleStudent(student.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                  ]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentBalance}>
                    {t('sessionComplete.currentBalance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                  </Text>
                  {isSelected && (
                    <Text style={styles.studentBalanceAfter}>
                      {t('sessionComplete.after')}: {newBalance} {Math.abs(newBalance) === 1 ? t('common.session') : t('common.sessions')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.attendanceStatus, !isSelected && styles.notAttended]}>
                  {isSelected ? t('sessionComplete.attended') : t('sessionComplete.didNotAttend')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Added Students (Not Planned) */}
        {addedStudents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleAdded}>
              {t('completeSession.addedAttendees')}
            </Text>
            {addedStudents.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              const newBalance = student.balance - sessionDeduction;

              return (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentCard, styles.studentCardAdded, isSelected && styles.studentCardSelected]}
                  onPress={() => toggleStudent(student.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentBalance}>
                      {t('sessionComplete.currentBalance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                    </Text>
                    {isSelected && (
                      <Text style={styles.studentBalanceAfter}>
                        {t('sessionComplete.after')}: {newBalance} {Math.abs(newBalance) === 1 ? t('common.session') : t('common.sessions')}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.attendanceStatus}>
                    {t('sessionComplete.attended')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Add Student Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddStudentModal(true)}
          >
            <Text style={styles.addButtonText}>
              + {t('completeSession.addStudentNotPlanned')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('sessionComplete.totalAttendees')}:</Text>
          <Text style={styles.summaryValue}>{selectedStudentIds.length}</Text>
        </View>
      </ScrollView>

      {/* Add Student Modal */}
      <AddStudentModal
        visible={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onStudentAdded={handleStudentAdded}
        existingStudentIds={session.studentIds}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    width: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#4f46e5',
  },
  typeCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  typeSubtext: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  studentCardSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  studentBalance: {
    fontSize: 12,
    color: '#666',
  },
  studentBalanceAfter: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
  },
  attendanceStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#22c55e',
  },
  notAttended: {
    color: '#ef4444',
  },
  summaryCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  completeButtonHeader: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonHeaderDisabled: {
    backgroundColor: '#9ca3af',
  },
  completeButtonHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitleAdded: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 12,
  },
  studentCardAdded: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
});

