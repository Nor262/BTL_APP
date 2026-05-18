import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
  onComplete?: (value: string) => void;
}

export default function OtpInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
    
    if (cleaned.length === length) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete?.(cleaned);
    }
  };

  // Render the individual box elements
  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < length; i++) {
      const char = value[i] || '';
      const isCurrent = i === value.length;
      const isLast = i === length - 1;
      const isAppliedFocused = isFocused && (isCurrent || (isLast && value.length === length));

      boxes.push(
        <View
          key={i}
          className={`w-12 h-14 border-2 rounded-xl bg-gray-50 items-center justify-center transition-all ${
            isAppliedFocused
              ? 'border-primary bg-white shadow-sm scale-105'
              : char
              ? 'border-primary bg-blue-50/20'
              : 'border-gray-200'
          }`}
        >
          <Text className="text-xl font-bold text-gray-900">
            {char}
          </Text>
          {isAppliedFocused && !char && (
            <View className="absolute w-0.5 h-6 bg-primary animate-pulse" />
          )}
        </View>
      );
    }
    return boxes;
  };

  return (
    <Pressable onPress={handlePress} className="w-full my-4 items-center">
      <View className="flex-row justify-between w-full max-w-[340px] px-2">
        {renderBoxes()}
      </View>
      
      {/* Hidden input field that handles typing, autofocus and paste natively */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
