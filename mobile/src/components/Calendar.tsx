import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  setYear,
  getYear,
} from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Session } from '@shared/types';
import { getSessions } from '../lib/storage';
import { formatDateForUrl } from '@shared/utils/dateUtils';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  onSessionClick: (session: Session) => void;
  refreshTrigger?: number;
}

export function Calendar({ onDateSelect, onSessionClick, refreshTrigger }: CalendarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const loadSessions = async () => {
    const loadedSessions = await getSessions();
    setSessions(loadedSessions);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => isSameDay(new Date(session.date), date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = formatDateForUrl(date);
    // Navigate to day view
    router.push(`/calendar/day/${dateStr}` as any);
    
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const previousMonth = () => {
    setIsTransitioning(true);
    setCurrentMonth(subMonths(currentMonth, 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const nextMonth = () => {
    setIsTransitioning(true);
    setCurrentMonth(addMonths(currentMonth, 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Swipe gesture implementation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: GestureResponderEvent) => {
    setTouchEnd(null);
    setTouchStart(e.nativeEvent.pageX);
  };

  const onTouchMove = (e: GestureResponderEvent) => {
    setTouchEnd(e.nativeEvent.pageX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextMonth();
    }
    if (isRightSwipe) {
      previousMonth();
    }
  };

  const currentYear = getYear(new Date());
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleYearChange = (year: number) => {
    const updatedMonth = setYear(currentMonth, year);
    setCurrentMonth(updatedMonth);
    setShowYearPicker(false);
  };

  const weekDays = [
    t('calendar.weekDays.monday'),
    t('calendar.weekDays.tuesday'),
    t('calendar.weekDays.wednesday'),
    t('calendar.weekDays.thursday'),
    t('calendar.weekDays.friday'),
    t('calendar.weekDays.saturday'),
    t('calendar.weekDays.sunday')
  ];

  const months = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december')
  ];

  const handleMonthChange = (monthIndex: number) => {
    const updatedMonth = new Date(getYear(currentMonth), monthIndex, 1);
    setCurrentMonth(updatedMonth);
    setShowMonthPicker(false);
  };

  // Split days into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={previousMonth}
          disabled={isTransitioning}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.selectors}>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowYearPicker(!showYearPicker)}
          >
            <Text style={styles.selectorText}>{getYear(currentMonth)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <Text style={styles.selectorText}>{months[currentMonth.getMonth()]}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={nextMonth}
          disabled={isTransitioning}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Year Picker */}
      {showYearPicker && (
        <ScrollView style={styles.picker}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              onPress={() => handleYearChange(year)}
              style={styles.pickerItem}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  getYear(currentMonth) === year && styles.pickerItemSelected,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Month Picker */}
      {showMonthPicker && (
        <ScrollView style={styles.picker}>
          {months.map((month, index) => (
            <TouchableOpacity
              key={month}
              onPress={() => handleMonthChange(index)}
              style={styles.pickerItem}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  currentMonth.getMonth() === index && styles.pickerItemSelected,
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Calendar Grid */}
      <View
        style={styles.calendarContainer}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Week Days Header */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const daySessions = getSessionsForDate(day)
                .slice()
                .sort((a, b) =>
                  a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0
                );
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasAnySessions = daySessions.length > 0;

              const statusCounts = {
                scheduled: daySessions.filter((s) => s.status === 'scheduled').length,
                completed: daySessions.filter((s) => s.status === 'completed').length,
                cancelled: daySessions.filter((s) => s.status === 'cancelled').length,
              };

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.dayCellOtherMonth,
                    isSelected && styles.dayCellSelected,
                    isToday && styles.dayCellToday,
                    dayIndex === 6 && !isToday && styles.dayCellLastInRow,
                  ]}
                  onPress={() => handleDateClick(day)}
                >
                  {/* Date Number */}
                  <View style={styles.dateContainer}>
                    <View
                      style={[
                        styles.dateCircle,
                        hasAnySessions && styles.dateCircleWithSessions,
                        isToday && !hasAnySessions && styles.dateCircleToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          !isCurrentMonth && styles.dateTextOtherMonth,
                          (hasAnySessions || isToday) && styles.dateTextHighlight,
                        ]}
                      >
                        {format(day, 'd')}
                      </Text>
                    </View>
                  </View>

                  {/* Session Indicators */}
                  {hasAnySessions && (
                    <View style={styles.sessionIndicators}>
                      {statusCounts.scheduled > 0 && (
                        <View style={[styles.sessionBadge, styles.sessionBadgeScheduled]}>
                          <Text style={styles.sessionBadgeText}>{statusCounts.scheduled}</Text>
                        </View>
                      )}
                      {statusCounts.completed > 0 && (
                        <View style={[styles.sessionBadge, styles.sessionBadgeCompleted]}>
                          <Text style={styles.sessionBadgeText}>{statusCounts.completed}</Text>
                        </View>
                      )}
                      {statusCounts.cancelled > 0 && (
                        <View style={[styles.sessionBadge, styles.sessionBadgeCancelled]}>
                          <Text style={styles.sessionBadgeText}>{statusCounts.cancelled}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// Calculate exact inner width of the calendar container: screen width
// minus horizontal margins (8 * 2) and the container border (1 * 2)
const cellSize = (width - 18) / 7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    margin: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  selectors: {
    flexDirection: 'row',
    gap: 16,
  },
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  picker: {
    maxHeight: 200,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemSelected: {
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  weekDaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  weekDayCell: {
    width: cellSize,
    padding: 8,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  weekRow: {
    flexDirection: 'row',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    overflow: 'visible',
  },
  dayCell: {
    width: cellSize,
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    alignItems: 'center',
  },
  dayCellLastInRow: {
    borderRightWidth: 0,
  },
  dayCellOtherMonth: {
    backgroundColor: '#f9f9f9',
  },
  dayCellSelected: {
    backgroundColor: '#4f46e5',
  },
  dayCellToday: {
    backgroundColor: '#4f46e520',
    borderColor: '#4f46e5',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    position: 'relative',
    zIndex: 2,
    marginRight: -1,
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dateCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleWithSessions: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
  },
  dateCircleToday: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateTextOtherMonth: {
    color: '#999',
  },
  dateTextHighlight: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sessionIndicators: {
    alignItems: 'center',
    gap: 4,
  },
  sessionBadge: {
    width: 16,
    height: 16,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBadgeScheduled: {
    backgroundColor: '#B5B5BA',
  },
  sessionBadgeCompleted: {
    backgroundColor: '#4f46e5',
  },
  sessionBadgeCancelled: {
    backgroundColor: '#f97316',
  },
  sessionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

