import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Session, Student } from '@shared/types';
import {
  getStudents,
  getSessions,
  cancelSession,
  deleteSession,
} from '../../src/lib/storage';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/lib/i18n';

export default function SessionDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const sessions = await getSessions();
      const foundSession = sessions.find((s) => s.id === id);

      if (foundSession) {
        setSession(foundSession);
        const allStudents = await getStudents();
        setStudents(allStudents);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Always use router.back() to pop the current screen from the stack
    // This prevents accumulating multiple screens in the navigation stack
    router.back();
  };

  const handleEdit = () => {
    router.push(`/sessions/${id}/edit?returnTo=${returnTo || '/(tabs)'}` as any);
  };

  const handleCancel = () => {
    Alert.alert(
      t('sessions.cancelSessionTitle'),
      t('sessions.cancelSessionDescription'),
      [
        { text: t('sessions.no'), style: 'cancel' },
        {
          text: t('sessions.cancelConfirm'),
          style: 'destructive',
          onPress: async () => {
            if (session) {
              await cancelSession(session.id);
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    // Navigate to complete session screen
    router.push(`/sessions/${id}/complete?returnTo=${returnTo || '/(tabs)'}` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      t('sessions.deleteSession'),
      t('sessions.deleteSessionDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('sessions.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            if (session) {
              await deleteSession(session.id);
              handleBack();
            }
          },
        },
      ]
    );
  };

  const handleStudentPress = (studentId: string) => {
    // Navigate to student details page with returnTo parameter to come back to this session
    const currentPath = `/sessions/${id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
    router.push(`/student/${studentId}?returnTo=${encodeURIComponent(currentPath)}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('sessions.loadingSessionDetails')}</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backButtonText}>← {t('sessions.back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('sessions.sessionNotFound')}</Text>
          <TouchableOpacity style={styles.button} onPress={handleBack}>
            <Text style={styles.buttonText}>{t('sessions.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sessionStudents = students.filter((s) => session.studentIds.includes(s.id));

  const getStatusBadge = () => {
    const statusStyles = {
      scheduled: styles.statusScheduled,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
    };
    return statusStyles[session.status] || statusStyles.scheduled;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header - Fixed at top */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButtonText}>← {t('sessions.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {session.status !== 'completed' && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>{t('sessions.delete')}</Text>
            </TouchableOpacity>
          )}
          {session.status === 'scheduled' && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>{t('sessions.edit')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: session.status === 'scheduled' ? 88 : 16 }
        ]}
      >
        {/* Header with status */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('sessionDetails.title')}</Text>
          <View style={[styles.statusBadge, getStatusBadge()]}>
            <Text style={[
              styles.statusBadgeText,
              session.status === 'cancelled' && styles.statusBadgeTextCancelled,
              session.status === 'scheduled' && styles.statusBadgeTextScheduled
            ]}>{t(`sessionDetails.${session.status}`)}</Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sessionDetails.date')}</Text>
          <Text style={styles.sectionValue}>
            {new Date(session.date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sessionDetails.time')}</Text>
          <Text style={styles.sectionValue}>
            {session.startTime} - {session.endTime}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sessionDetails.sessionType')}</Text>
          <Text style={styles.sectionValue}>
            {session.sessionType === 'team' ? t('sessionDetails.team') : t('sessionDetails.individual')}
          </Text>
        </View>

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('sessions.attendeesLabel')} ({sessionStudents.length})
          </Text>
          {sessionStudents.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentCard}
              onPress={() => handleStudentPress(student.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.studentName}>{student.name}</Text>
              <Text
                style={[
                  styles.studentBalance,
                  student.balance > 0 && styles.studentBalancePositive,
                  student.balance < 0 && styles.studentBalanceNegative,
                ]}
              >
                {t('sessions.currentBalance')}: {student.balance > 0 ? '+' : ''}
                {student.balance} {Math.abs(student.balance) === 1 ? t('calendar.sessions.session') : t('calendar.sessions.sessions')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('sessions.sessionGoalsLabel')}</Text>
          <View style={styles.goalsContainer}>
            {session.goals && session.goals.length > 0 ? (
              session.goals.map((goal) => (
                <View key={goal} style={styles.goalChip}>
                  <Text style={styles.goalChipText}>{goal}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyGoalsText}>{t('studentDetails.noGoalsSet')}</Text>
            )}
          </View>
        </View>

        {/* Notes */}
        {session.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('sessions.notesLabel')}</Text>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.metadataText}>
            {t('sessions.createdOn')}{' '}
            {new Date(session.createdAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action bar (pinned) */}
      {session.status === 'scheduled' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.actionButtonText}>{t('sessions.cancelSession')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
          >
            <Text style={styles.actionButtonText}>{t('sessions.completeSession')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    // paddingBottom is set dynamically based on bottom bar and safe area
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusScheduled: {
    backgroundColor: '#f3f4f6',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusCancelled: {
    backgroundColor: '#fff7ed',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#333',
  },
  statusBadgeTextCancelled: {
    color: '#f97316',
  },
  statusBadgeTextScheduled: {
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionValue: {
    fontSize: 16,
    color: '#333',
  },
  studentCard: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginTop: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentBalance: {
    fontSize: 12,
    color: '#666',
  },
  studentBalancePositive: {
    color: '#22c55e',
  },
  studentBalanceNegative: {
    color: '#ef4444',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
  },
  goalChipText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  emptyGoalsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f97316',
  },
  completeButton: {
    backgroundColor: '#4f46e5',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

