/**
 * Custom Badge Component for Tab Bar
 * Positions badge in the top-right corner of the icon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TabBadgeProps {
  count: number;
  maxCount?: number;
}

export function TabBadge({ count, maxCount = 99 }: TabBadgeProps) {
  // Don't render badge if count is 0 or negative
  if (count <= 0) return null;

  // Format count for display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  // Calculate dynamic width based on number of digits
  // Formula: base padding (12) + character width (9 per char) + extra padding (4)
  const digitCount = displayCount.length;
  const dynamicWidth = Math.max(22, 12 + (digitCount * 9) + 4);

  return (
    <View style={[styles.badge, { minWidth: dynamicWidth }]}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -14,
    right: -30,
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444', // red-500
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

