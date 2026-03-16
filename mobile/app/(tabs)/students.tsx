import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { Student } from '@shared/types';
import { getStudents } from '../../src/lib/storage';
import { formatBalanceForDisplay } from '@shared/utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function StudentsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'name' | 'date'>('name');
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  useEffect(() => {
    // Disable swipe back gesture on this tab screen
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    // Sort and filter students based on search query and sort mode
    const sorted = [...students].sort((a, b) => {
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      // sort by createdAt, newest first
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    if (searchQuery.length === 0) {
      setFilteredStudents(sorted);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sorted.filter((student) => {
        const name = student.name.toLowerCase().trim();
        // match from the beginning of any word in the name
        const words = name.split(/\s+/);
        return words.some((word) => word.startsWith(query));
      });
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students, sortMode]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const studentsData = await getStudents();
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert(t('students.errorLoading'), 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentPress = (studentId: string) => {
    router.push(`/student/${studentId}`);
  };

  const handleCreateNew = () => {
    router.push('/student/new');
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#16a34a'; // green for positive values
    if (balance < 0) return '#dc2626'; // red for negative values
    return '#6b7280'; // grey for zero
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('students.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Search and Create Button */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('students.search')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortMode === 'name' && styles.sortButtonActive,
            ]}
            onPress={() => setSortMode('name')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortMode === 'name' && styles.sortButtonTextActive,
              ]}
            >
              A-Z
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortMode === 'date' && styles.sortButtonActive,
            ]}
            onPress={() => setSortMode('date')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortMode === 'date' && styles.sortButtonTextActive,
              ]}
            >
              Date added
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create New Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>{t('students.createNew')}</Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>
              {searchQuery.length >= 2
                ? t('students.noStudentsFound')
                : t('students.noStudents')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.length >= 2
                ? t('students.noStudentsFoundDescription')
                : t('students.noStudentsDescription')}
            </Text>
            {searchQuery.length >= 2 ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>
                  {t('students.clearSearch')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateNew}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>
                  {t('students.createNew')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.studentsList}>
            {filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => handleStudentPress(student.id)}
                activeOpacity={0.7}
              >
                <View style={styles.studentInfo}>
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{student.name}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.balanceBadge,
                    {
                      backgroundColor: getBalanceColor(student.balance) + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.balanceText,
                      { color: getBalanceColor(student.balance) },
                    ]}
                  >
                    {formatBalanceForDisplay(student.balance)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  studentsList: {
    padding: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
  },
  studentPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  clearButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  sortButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
});
