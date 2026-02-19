import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO, isSameDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Session, Student } from '@shared/types';
import { getSessions, getStudents } from '../../../src/lib/storage';
import { formatDateForUrl, parseDateFromUrl } from '@shared/utils/dateUtils';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function DayViewScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [daySessions, setDaySessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (date) {
      try {
        const parsedDate = parseDateFromUrl(date);
        setSelectedDate(parsedDate);
        loadData(parsedDate);
      } catch (error) {
        console.error('Invalid date format:', error);
        router.back();
      }
    }
  }, [date]);

  const loadData = async (selectedDate: Date) => {
    setIsLoading(true);
    try {
      const allSessions = await getSessions();
      const allStudents = await getStudents();

      setSessions(allSessions);
      setStudents(allStudents);

      // Filter sessions for the selected date
      const filteredSessions = allSessions.filter((session) =>
        isSameDay(new Date(session.date), selectedDate)
      );
      setDaySessions(filteredSessions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate time slots (30-minute intervals from 06:00 to 22:00)
  const timeSlots = Array.from({ length: 33 }, (_, i) => {
    const hours = Math.floor(i / 2) + 6;
    const minutes = (i % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  // Precompute a map: time string -> slot index
  const timeToIndex: Record<string, number> = Object.fromEntries(
    timeSlots.map((t, idx) => [t, idx])
  );

  const handleTimeSlotClick = (timeSlot: string) => {
    if (!selectedDate) return;
    const dateStr = formatDateForUrl(selectedDate);
    router.push(`/sessions/new?date=${dateStr}&time=${timeSlot}&returnTo=/calendar/day/${dateStr}` as any);
  };

  const handleSessionClick = (session: Session) => {
    if (!selectedDate) return;
    const dateStr = formatDateForUrl(selectedDate);
    router.push(`/sessions/${session.id}?returnTo=/calendar/day/${dateStr}` as any);
  };

  const handleBackToCalendar = () => {
    router.push('/(tabs)');
  };

  // Utility: convert HH:MM to minutes since midnight
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map((v) => parseInt(v, 10));
    return h * 60 + m;
  };

  // Calculate statistics
  const scheduledCount = daySessions.filter((s) => s.status === 'scheduled').length;
  const completedCount = daySessions.filter((s) => s.status === 'completed').length;
  const cancelledCount = daySessions.filter((s) => s.status === 'cancelled').length;

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return styles.sessionScheduled;
      case 'completed':
        return styles.sessionCompleted;
      case 'cancelled':
        return styles.sessionCancelled;
      default:
        return styles.sessionScheduled;
    }
  };

  if (isLoading || !selectedDate) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('calendarDay.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToCalendar} style={styles.backButton}>
          <Text style={styles.backButtonText}>← {t('calendarDay.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerDay}>
            {format(selectedDate, 'EEEE', { locale: i18n.language === 'ru' ? ru : enUS })}
          </Text>
          <Text style={styles.headerDate}>
            {i18n.language === 'ru' 
              ? format(selectedDate, 'd MMMM, yyyy', { locale: ru })
              : format(selectedDate, 'MMMM d, yyyy', { locale: enUS })
            }
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('calendarDay.totalSessions')}</Text>
          <Text style={styles.summaryValue}>{daySessions.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('calendarDay.scheduled')}</Text>
          <Text style={[styles.summaryValue, styles.scheduledText]}>{scheduledCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('calendarDay.completed')}</Text>
          <Text style={[styles.summaryValue, styles.completedText]}>{completedCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('calendarDay.cancelled')}</Text>
          <Text style={[styles.summaryValue, styles.cancelledText]}>{cancelledCount}</Text>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timelineContainer}>
        {/* Positioning container so overlayed sessions can span multiple rows */}
        <View style={{ position: 'relative', height: timeSlots.length * styles.timeSlot.minHeight }}>
          {/* Grid rows with labels and add-session tap areas */}
          {timeSlots.map((timeSlot) => {
            const isHourMark = timeSlot.endsWith(':00');
            return (
              <View
                key={timeSlot}
                style={[styles.timeSlot, isHourMark && styles.timeSlotHour]}
              >
                <View style={[styles.timeLabel, isHourMark && styles.timeLabelHour]}>
                  <Text style={[styles.timeLabelText, isHourMark && styles.timeLabelTextHour]}>
                    {timeSlot}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.timeSlotContent}
                  onPress={() => handleTimeSlotClick(timeSlot)}
                />
              </View>
            );
          })}

          {/* Overlay sessions spanning multiple slots */}
          <View style={styles.sessionsOverlay} pointerEvents="box-none">
            {daySessions
              .slice()
              .sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0))
              .map((session) => {
                const startIdx = timeToIndex[session.startTime];
                const endIdx = Math.max(
                  startIdx + 1,
                  timeToIndex[session.endTime] ?? startIdx + Math.ceil((timeToMinutes(session.endTime) - timeToMinutes(session.startTime)) / 30)
                );
                if (startIdx === undefined) return null;
                const durationSlots = Math.max(1, endIdx - startIdx);
                const top = startIdx * styles.timeSlot.minHeight + 8; // small inner padding
                const height = durationSlots * styles.timeSlot.minHeight - 16; // account for padding
                const sessionStudents = students.filter((s) => session.studentIds.includes(s.id));

                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionBlock,
                      getStatusColor(session.status),
                      { top, height },
                    ]}
                    onPress={() => handleSessionClick(session)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionTime}>
                        {session.startTime} - {session.endTime}
                      </Text>
                      <View style={styles.sessionStatusBadge}>
                        <Text style={[
                          styles.sessionStatusText,
                          session.status === 'cancelled' && styles.sessionStatusTextCancelled,
                          session.status === 'scheduled' && styles.sessionStatusTextScheduled
                        ]}>{t(`calendarDay.status.${session.status}`)}</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionType}>
                      {session.sessionType === 'team' ? t('sessionDetails.team') : t('sessionDetails.individual')} {t('calendarDay.session')}
                    </Text>
                    <Text style={styles.sessionAttendees}>
                      {sessionStudents.length} {sessionStudents.length === 1 ? t('calendarDay.attendee') : t('calendarDay.attendees')}
                    </Text>
                    {sessionStudents.length > 0 && (
                      <Text style={styles.sessionStudentNames} numberOfLines={1}>
                        {sessionStudents.map((s) => s.name).join(', ')}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#f5f5f5',
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
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  headerDate: {
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduledText: {
    color: '#666',
  },
  completedText: {
    color: '#22c55e',
  },
  cancelledText: {
    color: '#f97316',
  },
  timelineContainer: {
    flex: 1,
  },
  sessionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 70, // align to the right of time labels
    right: 8, // match timeSlotContent padding
    zIndex: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    minHeight: 60,
  },
  timeSlotHour: {
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e520',
  },
  timeLabel: {
    width: 70,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeLabelHour: {
    backgroundColor: '#f5f5f5',
  },
  timeLabelText: {
    fontSize: 12,
    color: '#999',
  },
  timeLabelTextHour: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  timeSlotContent: {
    flex: 1,
    padding: 8,
  },
  sessionBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  sessionCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  sessionScheduled: {
    backgroundColor: '#f3f4f6',
    borderLeftColor: '#9ca3af',
  },
  sessionCompleted: {
    backgroundColor: '#dcfce7',
    borderLeftColor: '#22c55e',
  },
  sessionCancelled: {
    backgroundColor: '#fff7ed',
    borderLeftColor: '#f97316',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sessionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    textTransform: 'capitalize',
  },
  sessionStatusTextCancelled: {
    color: '#f97316',
  },
  sessionStatusTextScheduled: {
    color: '#6b7280',
  },
  sessionType: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  sessionAttendees: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  sessionStudentNames: {
    fontSize: 11,
    color: '#999',
  },
});

