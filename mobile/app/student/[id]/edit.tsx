import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Student } from '@shared/types';
import { getStudents, saveStudent, getSettings } from '../../../src/lib/storage';
import { useTranslation } from 'react-i18next';
import DatePickerInput from '../../../src/components/DatePicker';

export default function EditStudentScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { t } = useTranslation();
  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [memberSince, setMemberSince] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [descriptionSectionY, setDescriptionSectionY] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const descriptionSectionRef = useRef<View>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleDescriptionFocus = () => {
    setIsDescriptionFocused(true);
    // Scroll to description section position
    setTimeout(() => {
      if (descriptionSectionY > 0) {
        scrollViewRef.current?.scrollTo({ 
          y: Math.max(0, descriptionSectionY - 20), 
          animated: true 
        });
      }
    }, 100);
  };

  const handleDescriptionBlur = () => {
    setIsDescriptionFocused(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const studentsData = await getStudents();
      const student = studentsData.find(s => s.id === id);
      const settings = await getSettings();

      if (!student) {
        Alert.alert(t('common.error'), t('studentDetails.studentNotFound'));
        router.back();
        return;
      }

      setOriginalStudent(student);
      setAvailableGoals(settings.availableGoals || []);

      // Populate form fields
      setName(student.name);
      setPhone(student.phone || '');
      setWeight(student.weight ? student.weight.toString() : '');
      setHeight(student.height ? student.height.toString() : '');
      setBirthday(student.birthday ? new Date(student.birthday) : undefined);
      setMemberSince(student.memberSince ? new Date(student.memberSince) : undefined);
      setDescription(student.description || '');
      setSelectedGoals(student.goals || []);
    } catch (error) {
      console.error('Error loading student data:', error);
      Alert.alert(t('common.error'), t('students.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  // Check if user has made any changes
  const hasUnsavedChanges = () => {
    if (!originalStudent) return false;
    
    return (
      name.trim() !== originalStudent.name ||
      phone.trim() !== (originalStudent.phone || '') ||
      weight !== (originalStudent.weight ? originalStudent.weight.toString() : '') ||
      height !== (originalStudent.height ? originalStudent.height.toString() : '') ||
      (birthday?.getTime() !== originalStudent.birthday?.getTime()) ||
      (memberSince?.getTime() !== originalStudent.memberSince?.getTime()) ||
      description.trim() !== (originalStudent.description || '') ||
      JSON.stringify(selectedGoals.sort()) !== JSON.stringify((originalStudent.goals || []).sort())
    );
  };

  // Handle back navigation with confirmation
  const handleBackClick = () => {
    const navigateBack = () => {
      if (returnTo) {
        router.push(returnTo as any);
      } else {
        router.back();
      }
    };

    if (hasUnsavedChanges()) {
      Alert.alert(
        t('studentPages.unsavedChanges'),
        t('studentPages.unsavedChangesDescription'),
        [
          {
            text: t('studentPages.no') || 'No',
            style: 'cancel',
          },
          {
            text: t('studentPages.yes') || 'Yes',
            style: 'destructive',
            onPress: navigateBack,
          },
        ]
      );
    } else {
      navigateBack();
    }
  };

  const handleSave = async () => {
    if (!originalStudent) return;

    if (!name.trim()) {
      Alert.alert(t('validation.enterStudentName'), '');
      return;
    }

    setIsSaving(true);
    try {
      const updatedStudent: Student = {
        ...originalStudent,
        name: name.trim(),
        phone: phone.trim(),
        goals: selectedGoals,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        birthday: birthday,
        memberSince: memberSince,
        description: description.trim(),
      };

      await saveStudent(updatedStudent);
      Alert.alert(t('common.success'), t('students.studentUpdated'), [
        { 
          text: 'OK', 
          onPress: () => {
            if (returnTo) {
              router.push(returnTo as any);
            } else {
              router.back();
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Error updating student:', error);
      Alert.alert(t('common.error'), t('students.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !originalStudent) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('studentPages.loadingStudentData')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('studentPages.editStudent')}</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('studentPages.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('studentDetails.personalInformation')}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('studentForm.nameRequired')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('studentPages.enterStudentName')}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('studentForm.phone')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('studentPages.enterPhoneNumber')}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>{t('studentForm.weight')} (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder={t('studentPages.enterWeight')}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>{t('studentForm.height')} (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder={t('studentPages.enterHeight')}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <DatePickerInput
            label={t('studentForm.birthday')}
            value={birthday}
            onChange={setBirthday}
            placeholder={t('studentPages.selectBirthday')}
            maxDate={new Date()}
          />

          <DatePickerInput
            label={t('studentPages.memberSince')}
            value={memberSince}
            onChange={setMemberSince}
            placeholder={t('studentPages.selectMemberSince')}
            maxDate={new Date()}
          />

          <View style={styles.balanceInfo}>
            <View>
              <Text style={styles.label}>{t('studentPages.currentBalance')}</Text>
              <Text style={styles.balanceValue}>
                {originalStudent.balance > 0 ? '+' : ''}{originalStudent.balance} {Math.abs(originalStudent.balance) === 1 ? t('calendar.sessions.session') : t('calendar.sessions.sessions')}
              </Text>
              <Text style={styles.helpText}>{t('studentPages.balanceSystemManaged')}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View 
          ref={descriptionSectionRef}
          style={styles.section}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setDescriptionSectionY(y);
          }}
        >
          <Text style={styles.sectionTitle}>{t('studentForm.description')}</Text>
          <TextInput
            ref={descriptionInputRef}
            style={[
              styles.input, 
              styles.textArea,
              isDescriptionFocused && styles.textAreaExpanded,
              isDescriptionFocused && keyboardHeight > 0 && {
                height: Dimensions.get('window').height - keyboardHeight - descriptionSectionY - 140
              }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('studentForm.descriptionPlaceholder')}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={isDescriptionFocused ? undefined : 4}
            textAlignVertical="top"
            onFocus={handleDescriptionFocus}
            onBlur={handleDescriptionBlur}
            autoCapitalize="sentences"
          />
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('studentPages.goalsAndFocusAreas')}</Text>
          <Text style={styles.sectionSubtitle}>{t('studentPages.selectGoalsForStudent')}</Text>
          <View style={styles.goalsContainer}>
            {availableGoals.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalChip,
                  selectedGoals.includes(goal) && styles.goalChipSelected
                ]}
                onPress={() => handleGoalToggle(goal)}
              >
                <Text style={[
                  styles.goalChipText,
                  selectedGoals.includes(goal) && styles.goalChipTextSelected
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
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
  },
  textAreaExpanded: {
    minHeight: 200,
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginRight: 8,
  },
  balanceInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
    marginBottom: 4,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  goalChipSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#4f46e5',
  },
  goalChipText: {
    fontSize: 14,
    color: '#374151',
  },
  goalChipTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

