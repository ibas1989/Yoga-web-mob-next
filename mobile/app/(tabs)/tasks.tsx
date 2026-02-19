import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Session, Student } from '@shared/types';
import { getSessions, getStudents } from '../../src/lib/storage';
import { 
  formatDateLocalized, 
  formatTimeString, 
  isSessionEndTimePassed 
} from '@shared/utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { addSessionEventListener, SessionEventDetail } from '../../src/lib/eventSystem';

interface Task {
  id: string;
  sessionId: string;
  sessionName: string;
  scheduledDate: Date;
  scheduledTime: string;
  studentNames: string[];
  summary: string;
}

export default function TasksScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Helper function to get the correct plural form for students
  const pluralize = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  const loadTasks = async () => {
    try {
      const sessions = await getSessions();
      const students = await getStudents();
      
      // Filter sessions that are scheduled and whose end time has passed
      const overdueSessions = sessions.filter(
        (session) =>
          session.status === 'scheduled' && isSessionEndTimePassed(session)
      );

      // Convert sessions to tasks
      const taskList: Task[] = overdueSessions.map((session) => {
        const sessionStudents = students.filter((student) =>
          session.studentIds.includes(student.id)
        );

        // Get the correct form for "student" based on count
        let studentForm = '';
        if (i18n.language === 'ru') {
          studentForm = pluralize(
            sessionStudents.length,
            'студентом', // 1 student (instrumental singular)
            'студентами' // 2+ students (instrumental plural)
          );
        } else {
          studentForm = pluralize(
            sessionStudents.length,
            'student', // 1 student
            'students' // 2+ students
          );
        }

        return {
          id: `task-${session.id}`,
          sessionId: session.id,
          sessionName: t('tasks.sessionWithStudents', {
            count: sessionStudents.length,
            studentForm: studentForm,
          }),
          scheduledDate: new Date(session.date),
          scheduledTime: session.startTime,
          studentNames: sessionStudents.map((s) => s.name),
          summary: t('tasks.conductSession'),
        };
      });

      // Sort by date (oldest first)
      taskList.sort(
        (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
      );

      setTasks(taskList);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    // Disable swipe back gesture on this tab screen
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  // Listen to session events from the cron job
  useEffect(() => {
    const handleSessionEvent = (detail: SessionEventDetail) => {
      // Reload tasks when session changes or task list updates
      loadTasks();
    };

    // Listen to both sessionChanged and taskListUpdate events
    const cleanup1 = addSessionEventListener('sessionChanged', handleSessionEvent);
    const cleanup2 = addSessionEventListener('taskListUpdate', handleSessionEvent);

    // Cleanup listeners on unmount
    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  // Reload tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCompleteTask = (task: Task) => {
    setSelectedTask(null);
    // Navigate to the session details page
    router.push(`/sessions/${task.sessionId}?returnTo=/tasks`);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tasks.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('tasks.description')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>{t('tasks.loading')}</Text>
          <Text style={styles.loadingDescription}>
            {t('tasks.loadingDescription')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tasks.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('tasks.description')}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>✓</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('tasks.noPendingTasks')}</Text>
            <Text style={styles.emptyDescription}>
              {t('tasks.allSessionsUpToDate')}
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => handleTaskClick(task)}
                activeOpacity={0.7}
              >
                <View style={styles.taskIconContainer}>
                  <Text style={styles.taskIcon}>⏰</Text>
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskName}>{task.sessionName}</Text>
                  <View style={styles.taskDetails}>
                    <View style={styles.taskDetailRow}>
                      <Text style={styles.taskDetailIcon}>📅</Text>
                      <Text style={styles.taskDetailText}>
                        {t('tasks.date')}:{' '}
                        {formatDateLocalized(
                          task.scheduledDate,
                          i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                        )}
                      </Text>
                    </View>
                    <View style={styles.taskDetailRow}>
                      <Text style={styles.taskDetailIcon}>⏰</Text>
                      <Text style={styles.taskDetailText}>
                        {t('tasks.time')}:{' '}
                        {formatTimeString(
                          task.scheduledTime,
                          i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.taskBadge}>
                  <Text style={styles.taskBadgeText}>{t('tasks.pending')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Task Details Modal */}
      <Modal
        visible={selectedTask !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseTaskDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('tasks.taskDetails')}</Text>
              <TouchableOpacity
                onPress={handleCloseTaskDetails}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    {selectedTask.sessionName}
                  </Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailIcon}>📅</Text>
                    <Text style={styles.modalDetailText}>
                      {formatDateLocalized(
                        selectedTask.scheduledDate,
                        i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                      )}{' '}
                      {t('common.at')}{' '}
                      {formatTimeString(
                        selectedTask.scheduledTime,
                        i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                      )}
                    </Text>
                  </View>
                  {selectedTask.studentNames.length > 0 && (
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailIcon}>👥</Text>
                      <Text style={styles.modalDetailText}>
                        {selectedTask.studentNames.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.modalSection, styles.modalSectionBordered]}>
                  <Text style={styles.modalSectionTitle}>
                    {t('tasks.whatToDo')}
                  </Text>
                  <Text style={styles.modalSectionDescription}>
                    {selectedTask.summary}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={() => handleCompleteTask(selectedTask)}
                  >
                    <Text style={styles.modalButtonPrimaryText}>
                      ✓ {t('tasks.completeTask')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonSecondary}
                    onPress={handleCloseTaskDetails}
                  >
                    <Text style={styles.modalButtonSecondaryText}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  loadingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
    color: '#9ca3af',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  tasksList: {
    padding: 16,
    paddingBottom: 32,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskIcon: {
    fontSize: 20,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  taskDetails: {
    gap: 4,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  taskDetailIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  taskDetailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  taskBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c2410c',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#9ca3af',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionBordered: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  modalSectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
