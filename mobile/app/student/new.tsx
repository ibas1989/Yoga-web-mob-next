import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Student } from '@shared/types';
import { saveStudent, getSettings } from '../../src/lib/storage';
import { useTranslation } from 'react-i18next';
import DatePickerInput from '../../src/components/DatePicker';

export default function NewStudentScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { t } = useTranslation();
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const [balanceInputValue, setBalanceInputValue] = useState('0');
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
    loadSettings();
  }, []);

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

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setAvailableGoals(settings.availableGoals || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  // Check if user has entered any data
  const hasUnsavedChanges = () => {
    return (
      name.trim() !== '' ||
      phone.trim() !== '' ||
      balance !== 0 ||
      weight !== '' ||
      height !== '' ||
      birthday !== undefined ||
      memberSince !== undefined ||
      description.trim() !== '' ||
      selectedGoals.length > 0
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
    if (!name.trim()) {
      Alert.alert(t('validation.enterStudentName'), '');
      return;
    }

    setIsLoading(true);
    try {
      const newStudent: Student = {
        id: Date.now().toString(),
        name: name.trim(),
        phone: phone.trim(),
        balance,
        goals: selectedGoals,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        birthday: birthday,
        memberSince: memberSince || new Date(),
        description: description.trim(),
        notes: [],
        balanceTransactions: [],
        createdAt: new Date(),
      };

      await saveStudent(newStudent);
      Alert.alert(t('students.success'), t('students.studentCreated'), [
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
      console.error('Error saving student:', error);
      Alert.alert(t('common.error'), t('students.errorSaving'));
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>{t('studentPages.newStudent')}</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('studentPages.create')}</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('studentForm.initialBalance')}</Text>
            <TextInput
              style={styles.input}
              value={balanceInputValue}
              onChangeText={(value) => {
                setBalanceInputValue(value);
                setBalance(parseInt(value) || 0);
              }}
              placeholder={t('studentPages.enterInitialBalance')}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
            <Text style={styles.helpText}>{t('studentPages.balanceHelpText')}</Text>
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

