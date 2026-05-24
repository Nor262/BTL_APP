import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  rightLabel?: React.ReactNode;
  required?: boolean;
}

export default function Input({ label, error, icon, secureTextEntry, rightLabel, required, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = secureTextEntry;
  const isMultiline = props.multiline;

  return (
    <View className="mb-4 w-full" style={{ gap: 5 }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-[#64748B]">
          {label}
          {required && <Text className="text-[#EF4444]"> *</Text>}
        </Text>
        {rightLabel}
      </View>
      <View
        className={`flex-row bg-white rounded-[14px] px-4 ${
          isMultiline ? 'items-start py-3 min-h-[100px]' : 'items-center h-[46px]'
        }`}
        style={{ borderWidth: 1.5, borderColor: error ? '#EF4444' : '#E2E8F0', gap: 10 }}
      >
        {icon && (
          <Feather 
            name={icon as any} 
            size={16} 
            color="#94A3B8" 
            style={{ marginTop: isMultiline ? 2 : 0 }} 
          />
        )}
        <TextInput
          className={`flex-1 text-sm text-[#0F172A] ${isMultiline ? 'min-h-[80px] pt-0' : 'h-full pt-0'}`}
          style={{ 
            textAlignVertical: isMultiline ? 'top' : 'center',
            includeFontPadding: false,
          }}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPasswordField && !showPassword}
          multiline={isMultiline || false}
          {...props}
        />
        {isPasswordField && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? "eye" : "eye-off"} size={16} color="#94A3B8" />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
