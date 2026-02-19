import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface DatePickerInputProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePickerInput({
  label,
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
}: DatePickerInputProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('datePicker.selectDate');
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(selectedDate);
      }
    } else if (event.type === 'dismissed') {
      setIsOpen(false);
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setTempDate(value || new Date());
    setIsOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={styles.input}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={value ? '#374151' : '#9ca3af'} 
            style={styles.icon}
          />
          <Text style={[
            styles.inputText,
            !value && styles.placeholderText
          ]}>
            {value ? formatDate(value) : defaultPlaceholder}
          </Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <>
          {Platform.OS === 'ios' ? (
            // iOS: Show picker with action buttons
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={handleClear} style={styles.iosButton}>
                  <Text style={styles.iosClearButtonText}>{t('datePicker.clear')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} style={styles.iosButton}>
                  <Text style={styles.iosCancelButtonText}>{t('datePicker.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm} style={styles.iosButton}>
                  <Text style={styles.iosConfirmButtonText}>{t('datePicker.done')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                style={styles.iosPicker}
              />
            </View>
          ) : (
            // Android: Native dialog
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={handleChange}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iosButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iosClearButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  iosCancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  iosConfirmButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
});
