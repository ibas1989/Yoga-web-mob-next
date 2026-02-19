import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, Session, AppSettings, StudentNote, BalanceTransaction } from '@shared/types';
import { calculateAge, formatBalanceAsInteger, generateTransactionReason } from '@shared/utils/dateUtils';

const STUDENTS_KEY = 'yoga_tracker_students';
const SESSIONS_KEY = 'yoga_tracker_sessions';
const SETTINGS_KEY = 'yoga_tracker_settings';

// Default settings
const defaultSettings: AppSettings = {
  defaultTeamSessionCharge: 1,
  defaultIndividualSessionCharge: 2,
  availableGoals: [
    'Гибкость',
    'Сила',
    'Баланс',
    'Снятие стресса',
    'Похудение',
    'Медитация',
    'Укрепление корпуса',
    'Здоровая спина'
  ]
};

// Students
export const getStudents = async (): Promise<Student[]> => {
  try {
    const data = await AsyncStorage.getItem(STUDENTS_KEY);
    if (!data) return [];
    const students = JSON.parse(data);
    return students.map((s: any) => {
      const birthday = s.birthday ? new Date(s.birthday) : undefined;
      const memberSince = s.memberSince ? new Date(s.memberSince) : undefined;
      const age = calculateAge(birthday);
      const balance = formatBalanceAsInteger(s.balance || 0);
      
      return {
        ...s,
        createdAt: new Date(s.createdAt),
        birthday,
        memberSince,
        age,
        balance,
        notes: s.notes ? s.notes.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : undefined
        })) : [],
        balanceTransactions: s.balanceTransactions ? s.balanceTransactions.map((transaction: any) => ({
          ...transaction,
          date: new Date(transaction.date)
        })) : []
      };
    });
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

export const saveStudent = async (student: Student): Promise<void> => {
  try {
    const students = await getStudents();
    const existingIndex = students.findIndex(s => s.id === student.id);
    const age = calculateAge(student.birthday);
    const balance = formatBalanceAsInteger(student.balance || 0);
    
    const updatedStudent = {
      ...student,
      age,
      balance
    };
    
    if (existingIndex >= 0) {
      students[existingIndex] = updatedStudent;
    } else {
      students.push(updatedStudent);
    }
    
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error saving student:', error);
    throw error;
  }
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  try {
    const students = await getStudents();
    const filtered = students.filter(s => s.id !== studentId);
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// Sessions
export const getSessions = async (): Promise<Session[]> => {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data);
    return sessions.map((s: any) => ({
      ...s,
      date: new Date(s.date),
      createdAt: new Date(s.createdAt)
    }));
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

export const saveSession = async (session: Session): Promise<void> => {
  try {
    const sessions = await getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const sessions = await getSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

export const getSessionsForStudent = async (studentId: string): Promise<Session[]> => {
  const sessions = await getSessions();
  return sessions.filter(s => s.studentIds.includes(studentId));
};

// Settings
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!data) return defaultSettings;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

// Student Notes
export const addStudentNote = async (studentId: string, content: string): Promise<void> => {
  try {
    const students = await getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }
    
    const newNote: StudentNote = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
    };
    
    students[studentIndex].notes.push(newNote);
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error adding student note:', error);
    throw error;
  }
};

export const updateStudentNote = async (studentId: string, noteId: string, content: string): Promise<void> => {
  try {
    const students = await getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }
    
    const noteIndex = students[studentIndex].notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }
    
    students[studentIndex].notes[noteIndex] = {
      ...students[studentIndex].notes[noteIndex],
      content,
      updatedAt: new Date(),
    };
    
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error updating student note:', error);
    throw error;
  }
};

export const deleteStudentNote = async (studentId: string, noteId: string): Promise<void> => {
  try {
    const students = await getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }
    
    students[studentIndex].notes = students[studentIndex].notes.filter(n => n.id !== noteId);
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error deleting student note:', error);
    throw error;
  }
};

// Balance Transactions
export const addBalanceTransaction = async (studentId: string, changeAmount: number, reason: string): Promise<void> => {
  try {
    const students = await getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }
    
    const currentBalance = students[studentIndex].balance;
    const newBalance = currentBalance + changeAmount;
    
    const transaction: BalanceTransaction = {
      id: Date.now().toString(),
      date: new Date(),
      transactionType: changeAmount > 0 ? 'added' : 'deducted',
      changeAmount,
      reason,
      balanceAfter: newBalance,
    };
    
    students[studentIndex].balance = newBalance;
    students[studentIndex].balanceTransactions.push(transaction);
    
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error adding balance transaction:', error);
    throw error;
  }
};

