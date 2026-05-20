import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  rightLabel?: React.ReactNode;
}

export default function Input({ label, error, icon, secureTextEntry, rightLabel, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = secureTextEntry;

  return (
    <View className="w-full" style={{ gap: 5 }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-[#64748B]">{label}</Text>
        {rightLabel}
      </View>
      <View
        className={`flex-row items-center bg-white rounded-[14px] h-[46px] px-4`}
        style={{ borderWidth: 1.5, borderColor: error ? '#EF4444' : '#E2E8F0', gap: 10 }}
      >
        {icon && <Feather name={icon as any} size={16} color="#94A3B8" />}
        <TextInput
          className="flex-1 text-sm text-[#0F172A]"
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPasswordField && !showPassword}
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
