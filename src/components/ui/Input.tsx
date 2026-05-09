import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
}

export default function Input({ label, error, icon, secureTextEntry, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = secureTextEntry;

  return (
    <View className="mb-4 w-full">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View className={`flex-row items-center bg-gray-50 px-4 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200 focus:border-primary'}`}>
        {icon && <Feather name={icon as any} size={20} color="#666" style={{ marginRight: 10 }} />}
        <TextInput
          className="flex-1 py-3 text-gray-900 text-base"
          placeholderTextColor="#999"
          secureTextEntry={isPasswordField && !showPassword}
          {...props}
        />
        {isPasswordField && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
