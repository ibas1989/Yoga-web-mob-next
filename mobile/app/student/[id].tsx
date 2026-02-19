import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Linking, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Student, Session, BalanceTransaction, StudentNote } from '@shared/types';
import { getStudents, getSessionsForStudent, deleteStudent, addBalanceTransaction, addStudentNote, deleteStudentNote, updateStudentNote } from '../../src/lib/storage';
import { formatBalanceForDisplay, formatDateLocalized, getAgeInYearsAndMonthsTranslated, getMemberSinceAgeTranslated } from '@shared/utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function StudentDetailsScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { t, i18n } = useTranslation();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<BalanceTransaction | null>(null);
  const [showTransactionDetailsModal, setShowTransactionDetailsModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showNoteDetailsModal, setShowNoteDetailsModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StudentNote | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNoteContent, setEditedNoteContent] = useState('');
  const [hasNoteChanges, setHasNoteChanges] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const loadStudentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const studentsData = await getStudents();
      const foundStudent = studentsData.find(s => s.id === id);
      
      if (foundStudent) {
        setStudent(foundStudent);
        const studentSessions = await getSessionsForStudent(id as string);
        setSessions(studentSessions.sort((a, b) => b.date.getTime() - a.date.getTime()));
        // Reset pagination when data reloads
        setTransactionPage(1);
        setSessionPage(1);
      }
    } catch (error) {
      console.error('Error loading student:', error);
      Alert.alert(t('common.error'), t('students.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Refresh data when screen comes into focus (e.g., after editing a session)
  useFocusEffect(
    useCallback(() => {
      loadStudentData();
    }, [loadStudentData])
  );

  const handleEdit = () => {
    router.push(`/student/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(
      t('studentDetails.delete'),
      t('studentDetails.confirmDelete'),
      [
        { text: t('studentDetails.cancel'), style: 'cancel' },
        { 
          text: t('studentDetails.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(id as string);
              router.back();
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert(t('common.error'), t('students.errorDeleting'));
            }
          }
        }
      ]
    );
  };

  const handleAddBalance = async () => {
    if (!balanceAmount.trim() || !balanceReason.trim()) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    const amount = parseInt(balanceAmount);
    if (isNaN(amount)) {
      Alert.alert(t('common.error'), t('validation.invalidAmount'));
      return;
    }

    try {
      await addBalanceTransaction(id as string, amount, balanceReason);
      setBalanceAmount('');
      setBalanceReason('');
      setShowBalanceModal(false);
      await loadStudentData();
      Alert.alert(t('common.success'), t('studentDetails.transactionAdded'));
    } catch (error) {
      console.error('Error adding balance transaction:', error);
      Alert.alert(t('common.error'), t('studentDetails.errorAddingTransaction'));
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      Alert.alert(t('common.error'), 'Please enter note content');
      return;
    }

    try {
      await addStudentNote(id as string, noteContent);
      setNoteContent('');
      setShowNoteModal(false);
      await loadStudentData();
      Alert.alert(t('common.success'), t('studentDetails.noteAdded'));
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert(t('common.error'), t('studentDetails.errorAddingNote'));
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      t('studentDetails.deleteNote'),
      t('studentDetails.confirmDeleteNote'),
      [
        { text: t('studentDetails.cancel'), style: 'cancel' },
        {
          text: t('studentDetails.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudentNote(id as string, noteId);
              await loadStudentData();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert(t('common.error'), t('studentDetails.errorDeletingNote'));
            }
          }
        }
      ]
    );
  };

  const handleTransactionClick = (transaction: BalanceTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetailsModal(true);
  };

  const handleSessionClick = (session: Session) => {
    router.push(`/sessions/${session.id}?returnTo=/student/${id}` as any);
  };

  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    
    const phoneUrl = `tel:${phoneNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(t('common.error'), t('studentDetails.cannotMakeCall'));
      }
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      Alert.alert(t('common.error'), t('studentDetails.errorMakingCall'));
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#dc2626'; // red for owed sessions
    if (balance < 0) return '#16a34a'; // green for credit
    return '#16a34a'; // green for zero balance
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'cancelled':
        return { bg: '#fff7ed', text: '#f97316' };
      case 'scheduled':
        return { bg: '#f3f4f6', text: '#6b7280' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  // Helper function to get first 2 lines of description
  const getTruncatedDescription = (description: string) => {
    const lines = description.split('\n');
    const firstTwoLines = lines.slice(0, 2).join('\n');
    const hasMore = lines.length > 2;
    return { truncated: firstTwoLines, hasMore };
  };

  // Helper function to get first 2 lines of note
  const getTruncatedNote = (noteContent: string) => {
    const lines = noteContent.split('\n');
    const firstTwoLines = lines.slice(0, 2).join('\n');
    const hasMore = lines.length > 2;
    return { truncated: firstTwoLines, hasMore };
  };

  const handleNoteClick = (note: StudentNote) => {
    setSelectedNote(note);
    setEditedNoteContent(note.content);
    setIsEditingNote(false);
    setHasNoteChanges(false);
    setShowNoteDetailsModal(true);
  };

  const handleEditNote = () => {
    if (selectedNote) {
      setIsEditingNote(true);
      setEditedNoteContent(selectedNote.content);
      setHasNoteChanges(false);
    }
  };

  const handleNoteContentChange = (text: string) => {
    setEditedNoteContent(text);
    if (selectedNote && text !== selectedNote.content) {
      setHasNoteChanges(true);
    } else {
      setHasNoteChanges(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote || !editedNoteContent.trim()) {
      Alert.alert(t('common.error'), t('studentDetails.pleaseEnterNoteContent'));
      return;
    }

    setIsSavingNote(true);
    try {
      await updateStudentNote(id as string, selectedNote.id, editedNoteContent.trim());
      setIsEditingNote(false);
      setHasNoteChanges(false);
      await loadStudentData();
      // Update the selected note with new content
      const updatedNote = { ...selectedNote, content: editedNoteContent.trim(), updatedAt: new Date() };
      setSelectedNote(updatedNote);
      Alert.alert(t('common.success'), t('studentDetails.noteUpdated'));
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert(t('common.error'), t('studentDetails.errorUpdatingNote'));
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelEditNote = () => {
    if (hasNoteChanges) {
      Alert.alert(
        t('studentDetails.unsavedChanges'),
        t('studentDetails.unsavedNoteChangesDescription'),
        [
          { text: t('studentDetails.cancel'), style: 'cancel' },
          {
            text: t('studentDetails.discard'),
            style: 'destructive',
            onPress: () => {
              setIsEditingNote(false);
              setEditedNoteContent(selectedNote?.content || '');
              setHasNoteChanges(false);
            }
          }
        ]
      );
    } else {
      setIsEditingNote(false);
      setEditedNoteContent(selectedNote?.content || '');
      setHasNoteChanges(false);
    }
  };

  const handleCloseNoteModal = () => {
    if (isEditingNote && hasNoteChanges) {
      Alert.alert(
        t('studentDetails.unsavedChanges'),
        t('studentDetails.unsavedNoteChangesDescription'),
        [
          { text: t('studentDetails.cancel'), style: 'cancel' },
          {
            text: t('studentDetails.discard'),
            style: 'destructive',
            onPress: () => {
              setIsEditingNote(false);
              setHasNoteChanges(false);
              setShowNoteDetailsModal(false);
              setSelectedNote(null);
            }
          }
        ]
      );
    } else {
      setIsEditingNote(false);
      setHasNoteChanges(false);
      setShowNoteDetailsModal(false);
      setSelectedNote(null);
    }
  };

  const handleDeleteNoteFromModal = () => {
    if (!selectedNote) return;
    
    Alert.alert(
      t('studentDetails.deleteNote'),
      t('studentDetails.confirmDeleteNote'),
      [
        { text: t('studentDetails.cancel'), style: 'cancel' },
        {
          text: t('studentDetails.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudentNote(id as string, selectedNote.id);
              setShowNoteDetailsModal(false);
              setSelectedNote(null);
              await loadStudentData();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert(t('common.error'), t('studentDetails.errorDeletingNote'));
            }
          }
        }
      ]
    );
  };

  // Calculate paginated transactions
  const sortedTransactions = student?.balanceTransactions
    ? [...student.balanceTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())
    : [];
  const totalTransactionPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
  const startTransactionIndex = (transactionPage - 1) * ITEMS_PER_PAGE;
  const endTransactionIndex = startTransactionIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = sortedTransactions.slice(startTransactionIndex, endTransactionIndex);

  // Calculate paginated sessions
  const sortedSessions = [...sessions].sort((a, b) => b.date.getTime() - a.date.getTime());
  const totalSessionPages = Math.ceil(sortedSessions.length / ITEMS_PER_PAGE);
  const startSessionIndex = (sessionPage - 1) * ITEMS_PER_PAGE;
  const endSessionIndex = startSessionIndex + ITEMS_PER_PAGE;
  const paginatedSessions = sortedSessions.slice(startSessionIndex, endSessionIndex);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('studentDetails.loadingStudentDetails')}</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#dc2626" />
        <Text style={styles.errorText}>{t('studentDetails.studentNotFound')}</Text>
        <TouchableOpacity style={styles.backToListButton} onPress={() => router.back()}>
          <Text style={styles.backToListButtonText}>{t('studentDetails.returnToStudents')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{student.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Ionicons name="pencil" size={20} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('studentDetails.personalInformation')}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="person-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.name')}</Text>
            </View>
            <Text style={styles.infoValue}>{student.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="call-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.phone')}</Text>
            </View>
            {student.phone ? (
              <TouchableOpacity 
                onPress={() => handlePhoneCall(student.phone)}
                activeOpacity={0.7}
                style={styles.phoneContainer}
              >
                <Text style={[styles.infoValue, styles.phoneValue]}>
                  {student.phone}
                </Text>
                <Ionicons name="call-outline" size={18} color="#4f46e5" style={styles.phoneIcon} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.infoValue, styles.emptyValue]}>
                {t('studentDetails.noPhone')}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="scale-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.weight')}</Text>
            </View>
            <Text style={[styles.infoValue, !student.weight && styles.emptyValue]}>
              {student.weight ? `${student.weight} ${t('common.kg')}` : t('studentDetails.notSpecified')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="resize-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.height')}</Text>
            </View>
            <Text style={[styles.infoValue, !student.height && styles.emptyValue]}>
              {student.height ? `${student.height} ${t('common.cm')}` : t('studentDetails.notSpecified')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.birthday')}</Text>
            </View>
            <Text style={[styles.infoValue, !student.birthday && styles.emptyValue]}>
              {student.birthday ? formatDateLocalized(student.birthday, locale) : t('studentDetails.notSpecified')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="time-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.age')}</Text>
            </View>
            <Text style={[styles.infoValue, !student.birthday && styles.emptyValue]}>
              {getAgeInYearsAndMonthsTranslated(student.birthday, t)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.memberSince')}</Text>
            </View>
            <Text style={[styles.infoValue, !student.memberSince && styles.emptyValue]}>
              {student.memberSince ? formatDateLocalized(student.memberSince, locale) : t('studentDetails.notSpecified')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="time-outline" size={16} color="#6b7280" style={styles.labelIcon} />
              <Text style={styles.infoLabel}>{t('studentDetails.memberSinceAge')}</Text>
            </View>
            <Text style={styles.infoValue}>{getMemberSinceAgeTranslated(student.memberSince, t)}</Text>
          </View>

          <View style={styles.balanceRow}>
            <View>
              <View style={styles.labelContainer}>
                <Ionicons name="wallet-outline" size={16} color="#6b7280" style={styles.labelIcon} />
                <Text style={styles.infoLabel}>{t('studentDetails.currentBalance')}</Text>
              </View>
              <Text style={[styles.balanceValue, { color: getBalanceColor(student.balance) }]}>
                {student.balance > 0 ? '+' : ''}{formatBalanceForDisplay(student.balance)} {Math.abs(student.balance) === 1 ? t('calendar.sessions.session') : t('calendar.sessions.sessions')}
              </Text>
            </View>
            <TouchableOpacity style={styles.addBalanceButton} onPress={() => setShowBalanceModal(true)}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="document-text-outline" size={20} color="#111827" style={styles.sectionTitleIcon} />
            <Text style={styles.sectionTitleWithIcon}>{t('studentDetails.description')}</Text>
          </View>
          {student.description ? (() => {
            const { truncated, hasMore } = getTruncatedDescription(student.description);
            return (
              <TouchableOpacity 
                onPress={hasMore ? () => setShowDescriptionModal(true) : undefined}
                activeOpacity={hasMore ? 0.7 : 1}
                disabled={!hasMore}
              >
                <Text style={styles.descriptionText}>
                  {truncated}
                  {hasMore && (
                    <Text style={styles.descriptionMoreText}>...</Text>
                  )}
                </Text>
                {hasMore && (
                  <Text style={styles.descriptionTapHint}>{t('studentDetails.tapToViewFull')}</Text>
                )}
              </TouchableOpacity>
            );
          })() : (
            <Text style={styles.emptyText}>{t('studentDetails.noDescriptionProvided')}</Text>
          )}
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="flag-outline" size={20} color="#111827" style={styles.sectionTitleIcon} />
            <Text style={styles.sectionTitleWithIcon}>{t('studentDetails.goalsFocusAreas')}</Text>
          </View>
          {student.goals && student.goals.length > 0 ? (
            <View style={styles.goalsContainer}>
              {student.goals.map((goal) => (
                <View key={goal} style={styles.goalChip}>
                  <Text style={styles.goalChipText}>{goal}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{t('studentDetails.noGoalsSet')}</Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="document-outline" size={20} color="#111827" style={styles.sectionTitleIcon} />
              <Text style={styles.sectionTitleWithIcon}>{t('studentDetails.notes')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowNoteModal(true)}>
              <Ionicons name="add-circle" size={24} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          
          {student.notes && student.notes.length > 0 ? (
            student.notes
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((note) => {
                const { truncated, hasMore } = getTruncatedNote(note.content);
                return (
                  <View key={note.id} style={styles.noteCard}>
                    <TouchableOpacity 
                      onPress={hasMore ? () => handleNoteClick(note) : undefined}
                      activeOpacity={hasMore ? 0.7 : 1}
                      disabled={!hasMore}
                    >
                      <Text style={styles.noteContent}>
                        {truncated}
                        {hasMore && (
                          <Text style={styles.descriptionMoreText}>...</Text>
                        )}
                      </Text>
                      {hasMore && (
                        <Text style={styles.descriptionTapHint}>{t('studentDetails.tapToViewFull')}</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.noteFooter}>
                      <Text style={styles.noteDate}>
                        {formatDateLocalized(note.timestamp, locale)}
                      </Text>
                      <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
          ) : (
            <Text style={styles.emptyText}>{t('studentDetails.noNotesYet')}</Text>
          )}
        </View>

        {/* Balance Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="wallet-outline" size={20} color="#111827" style={styles.sectionTitleIcon} />
            <Text style={styles.sectionTitleWithIcon}>
              {t('studentDetails.balanceTransactionHistory')} ({sortedTransactions.length})
            </Text>
          </View>
          
          {sortedTransactions.length > 0 ? (
            <>
              {paginatedTransactions.map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionCard}
                  onPress={() => handleTransactionClick(transaction)}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionDate}>{formatDateLocalized(transaction.date, locale)}</Text>
                    <Text style={[styles.transactionAmount, { color: transaction.changeAmount > 0 ? '#16a34a' : '#dc2626' }]}>
                      {transaction.changeAmount > 0 ? '+' : ''}{transaction.changeAmount}
                    </Text>
                  </View>
                  <Text style={styles.transactionReason}>{transaction.reason}</Text>
                  <Text style={styles.transactionBalance}>
                    {t('studentDetails.updatedBalance')}: {transaction.balanceAfter}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {/* Pagination Controls for Transactions */}
              {totalTransactionPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, transactionPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => setTransactionPage(prev => Math.max(1, prev - 1))}
                    disabled={transactionPage === 1}
                  >
                    <Ionicons name="chevron-back" size={20} color={transactionPage === 1 ? '#9ca3af' : '#4f46e5'} />
                    <Text style={[styles.paginationButtonText, transactionPage === 1 && styles.paginationButtonTextDisabled]}>
                      {t('studentDetails.previous')}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.paginationInfo}>
                    {t('studentDetails.page')} {transactionPage} {t('studentDetails.of')} {totalTransactionPages}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.paginationButton, transactionPage === totalTransactionPages && styles.paginationButtonDisabled]}
                    onPress={() => setTransactionPage(prev => Math.min(totalTransactionPages, prev + 1))}
                    disabled={transactionPage === totalTransactionPages}
                  >
                    <Text style={[styles.paginationButtonText, transactionPage === totalTransactionPages && styles.paginationButtonTextDisabled]}>
                      {t('studentDetails.next')}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={transactionPage === totalTransactionPages ? '#9ca3af' : '#4f46e5'} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>{t('studentDetails.noBalanceTransactions')}</Text>
          )}
        </View>

        {/* Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar-outline" size={20} color="#111827" style={styles.sectionTitleIcon} />
            <Text style={styles.sectionTitleWithIcon}>
              {t('studentDetails.sessionHistory')} ({sortedSessions.length})
            </Text>
          </View>
          
          {sortedSessions.length > 0 ? (
            <>
              {paginatedSessions.map((session) => {
                const statusColors = getStatusColor(session.status);
                return (
                  <TouchableOpacity 
                    key={session.id} 
                    style={styles.sessionCard}
                    onPress={() => handleSessionClick(session)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionDate}>{formatDateLocalized(session.date, locale)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                          {t(`sessionDetails.${session.status}`)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.sessionTime}>{session.startTime} - {session.endTime}</Text>
                    <Text style={styles.sessionType}>
                      {session.sessionType === 'individual' ? t('sessions.individual') : t('sessions.team')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Pagination Controls for Sessions */}
              {totalSessionPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, sessionPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => setSessionPage(prev => Math.max(1, prev - 1))}
                    disabled={sessionPage === 1}
                  >
                    <Ionicons name="chevron-back" size={20} color={sessionPage === 1 ? '#9ca3af' : '#4f46e5'} />
                    <Text style={[styles.paginationButtonText, sessionPage === 1 && styles.paginationButtonTextDisabled]}>
                      {t('studentDetails.previous')}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.paginationInfo}>
                    {t('studentDetails.page')} {sessionPage} {t('studentDetails.of')} {totalSessionPages}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.paginationButton, sessionPage === totalSessionPages && styles.paginationButtonDisabled]}
                    onPress={() => setSessionPage(prev => Math.min(totalSessionPages, prev + 1))}
                    disabled={sessionPage === totalSessionPages}
                  >
                    <Text style={[styles.paginationButtonText, sessionPage === totalSessionPages && styles.paginationButtonTextDisabled]}>
                      {t('studentDetails.next')}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={sessionPage === totalSessionPages ? '#9ca3af' : '#4f46e5'} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>{t('studentDetails.noSessionsRecorded')}</Text>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Balance Modal */}
      {showBalanceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('studentDetails.addBalanceTransactionTitle')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('studentDetails.amount')}</Text>
              <TextInput
                style={styles.input}
                value={balanceAmount}
                onChangeText={setBalanceAmount}
                placeholder={t('studentDetails.enterAmountPositiveNegative')}
                keyboardType="number-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('studentDetails.reasonDescription')}</Text>
              <TextInput
                style={styles.input}
                value={balanceReason}
                onChangeText={setBalanceReason}
                placeholder={t('studentDetails.enterReasonTransaction')}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={() => {
                  setShowBalanceModal(false);
                  setBalanceAmount('');
                  setBalanceReason('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('studentDetails.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleAddBalance}>
                <Text style={styles.modalButtonTextConfirm}>{t('studentDetails.addTransaction')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('studentDetails.addNote')}</Text>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder={t('studentDetails.enterNoteContent')}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={() => {
                  setShowNoteModal(false);
                  setNoteContent('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('studentDetails.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleAddNote}>
                <Text style={styles.modalButtonTextConfirm}>{t('studentDetails.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Description Details Modal */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('studentDetails.description')}</Text>
            </View>

            {student && student.description && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionModalText}>{student.description}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowDescriptionModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>{t('transactionDetails.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Details Modal */}
      <Modal
        visible={showNoteDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseNoteModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('studentDetails.notes')}</Text>
                    {!isEditingNote && selectedNote && (
                      <View style={styles.modalHeaderActions}>
                        <TouchableOpacity onPress={handleEditNote} style={styles.modalHeaderButton}>
                          <Ionicons name="pencil" size={20} color="#4f46e5" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteNoteFromModal} style={styles.modalHeaderButton}>
                          <Ionicons name="trash" size={20} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {selectedNote && (
                    <ScrollView 
                      style={styles.modalBody} 
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.detailSection}>
                          {isEditingNote ? (
                            <View style={styles.descriptionCard}>
                              <TextInput
                                style={[styles.input, styles.textArea, styles.noteEditInput]}
                                value={editedNoteContent}
                                onChangeText={handleNoteContentChange}
                                placeholder={t('studentDetails.enterNoteContent')}
                                placeholderTextColor="#9ca3af"
                                multiline
                                textAlignVertical="top"
                                keyboardType="default"
                                returnKeyType="default"
                                blurOnSubmit={false}
                              />
                            </View>
                          ) : (
                            <View style={styles.descriptionCard}>
                              <Text style={styles.descriptionModalText}>{selectedNote.content}</Text>
                            </View>
                          )}
                          {!isEditingNote && (
                            <View style={styles.noteModalFooter}>
                              <Text style={styles.noteDate}>
                                {t('studentDetails.created')}: {formatDateLocalized(selectedNote.timestamp, locale)}
                              </Text>
                              {selectedNote.updatedAt && (
                                <Text style={styles.noteDate}>
                                  {t('studentDetails.updated')}: {formatDateLocalized(selectedNote.updatedAt, locale)}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                    </ScrollView>
                  )}

                  <View style={styles.modalFooter}>
                    {isEditingNote ? (
                      <View style={styles.modalFooterActions}>
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.modalButtonCancel]} 
                          onPress={() => {
                            Keyboard.dismiss();
                            handleCancelEditNote();
                          }}
                          disabled={isSavingNote}
                        >
                          <Text style={styles.modalButtonTextCancel}>{t('studentDetails.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.modalButtonConfirm]} 
                          onPress={() => {
                            Keyboard.dismiss();
                            handleSaveNote();
                          }}
                          disabled={isSavingNote}
                        >
                          {isSavingNote ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.modalButtonTextConfirm}>{t('studentDetails.save')}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.modalCloseButton} 
                        onPress={handleCloseNoteModal}
                      >
                        <Text style={styles.modalCloseButtonText}>{t('transactionDetails.close')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        visible={showTransactionDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTransactionDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('transactionDetails.title')}</Text>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Date */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('transactionDetails.date')}</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedTransaction.date).toLocaleDateString(locale, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Time */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('transactionDetails.time')}</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedTransaction.date).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Transaction Type */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons 
                      name={selectedTransaction.transactionType === 'added' ? 'trending-up' : 'trending-down'} 
                      size={20} 
                      color={selectedTransaction.transactionType === 'added' ? '#16a34a' : '#dc2626'} 
                      style={{ marginRight: 12 }}
                    />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('transactionDetails.transactionType')}</Text>
                      <View style={styles.detailValueRow}>
                        <Text style={styles.detailValue}>
                          {selectedTransaction.transactionType === 'added' 
                            ? t('transactionDetails.balanceAdded') 
                            : t('transactionDetails.balanceDeducted')}
                        </Text>
                        <View style={[
                          styles.typeBadge,
                          selectedTransaction.transactionType === 'added' 
                            ? styles.typeBadgeAdded 
                            : styles.typeBadgeDeducted
                        ]}>
                          <Text style={[
                            styles.typeBadgeText,
                            selectedTransaction.transactionType === 'added' 
                              ? styles.typeBadgeTextAdded 
                              : styles.typeBadgeTextDeducted
                          ]}>
                            {selectedTransaction.transactionType === 'added' 
                              ? t('transactionDetails.added') 
                              : t('transactionDetails.deducted')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Change Amount */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="wallet-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('transactionDetails.changeAmount')}</Text>
                      <Text style={[
                        styles.detailValue,
                        { color: selectedTransaction.changeAmount > 0 ? '#16a34a' : '#dc2626' }
                      ]}>
                        {selectedTransaction.changeAmount > 0 ? '+' : ''}{selectedTransaction.changeAmount} {Math.abs(selectedTransaction.changeAmount) === 1 ? t('transactionDetails.session') : t('transactionDetails.sessions')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Reason/Description */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('transactionDetails.reasonDescription')}</Text>
                      <View style={styles.reasonCard}>
                        <Text style={styles.reasonText}>
                          {(() => {
                            const currentLanguage = i18n.language;
                            if (currentLanguage === 'ru' && selectedTransaction.reasonRu) {
                              return selectedTransaction.reasonRu;
                            } else if (currentLanguage === 'en' && selectedTransaction.reasonEn) {
                              return selectedTransaction.reasonEn;
                            }
                            return selectedTransaction.reason || t('transactionDetails.noDescriptionProvided');
                          })()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Updated Balance */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="wallet-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('transactionDetails.updatedBalance')}</Text>
                      <View style={styles.balanceCard}>
                        <Text style={[
                          styles.modalBalanceValue,
                          selectedTransaction.balanceAfter > 0 
                            ? styles.balanceValuePositive 
                            : selectedTransaction.balanceAfter < 0 
                            ? styles.balanceValueNegative 
                            : styles.balanceValueNeutral
                        ]}>
                          {selectedTransaction.balanceAfter > 0 ? '+' : ''}{selectedTransaction.balanceAfter} {Math.abs(selectedTransaction.balanceAfter) === 1 ? t('transactionDetails.session') : t('transactionDetails.sessions')}
                        </Text>
                        <Text style={styles.balanceLabel}>
                          {t('transactionDetails.balanceAfterTransaction')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Transaction ID */}
                <View style={[styles.detailSection, styles.lastDetailSection]}>
                  <View style={styles.detailRow}>
                    <Ionicons name="information-circle-outline" size={20} color="#9ca3af" style={{ marginRight: 12 }} />
                    <Text style={styles.transactionIdText}>
                      {t('transactionDetails.transactionId')}: {selectedTransaction.id}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowTransactionDetailsModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>{t('transactionDetails.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 16,
    textAlign: 'center',
  },
  backToListButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
  backToListButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  headerButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleWithIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
  },
  sectionTitleIcon: {
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelIcon: {
    marginRight: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  emptyValue: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-end',
  },
  phoneValue: {
    color: '#4f46e5',
    marginRight: 6,
  },
  phoneIcon: {
    marginLeft: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  modalBalanceValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  addBalanceButton: {
    backgroundColor: '#4f46e5',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  descriptionMoreText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  descriptionTapHint: {
    fontSize: 12,
    color: '#4f46e5',
    marginTop: 8,
    fontStyle: 'italic',
  },
  descriptionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionModalText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 16,
  },
  goalChipText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  noteCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  noteModalFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  transactionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionReason: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  transactionBalance: {
    fontSize: 12,
    color: '#6b7280',
  },
  sessionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  bottomSpacing: {
    height: 40,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  modalOverlayContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  noteEditInput: {
    minHeight: 150,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonConfirm: {
    backgroundColor: '#4f46e5',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '98%',
    maxWidth: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderButton: {
    padding: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: '80%',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailSection: {
    marginBottom: 6,
  },
  lastDetailSection: {
    marginBottom: 0,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeAdded: {
    backgroundColor: '#dcfce7',
  },
  typeBadgeDeducted: {
    backgroundColor: '#fee2e2',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeTextAdded: {
    color: '#16a34a',
  },
  typeBadgeTextDeducted: {
    color: '#dc2626',
  },
  reasonCard: {
    backgroundColor: '#f9fafb',
    padding: 4,
    borderRadius: 6,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  balanceCard: {
    backgroundColor: '#f9fafb',
    padding: 4,
    borderRadius: 6,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  balanceValuePositive: {
    color: '#16a34a',
  },
  balanceValueNegative: {
    color: '#dc2626',
  },
  balanceValueNeutral: {
    color: '#6b7280',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionIdText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalFooter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    width: '100%',
  },
  modalCloseButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  paginationButtonTextDisabled: {
    color: '#9ca3af',
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
});

