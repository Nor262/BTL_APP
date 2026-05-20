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
  const isMultiline = props.multiline;

  return (
    <View className="mb-4 w-full">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View className={`flex-row bg-gray-50 px-4 rounded-xl border ${
        isMultiline ? 'items-start py-3 min-h-[100px]' : 'items-center h-14'
      } ${error ? 'border-red-500' : 'border-gray-200 focus:border-primary'}`}>
        {icon && (
          <Feather 
            name={icon as any} 
            size={20} 
            color="#666" 
            style={{ marginRight: 10, marginTop: isMultiline ? 2 : 0 }} 
          />
        )}
        <TextInput
          className={`flex-1 text-gray-900 text-base ${isMultiline ? 'min-h-[80px] pt-0' : 'h-12 pt-0 pb-1'}`}
          style={{ 
            textAlignVertical: isMultiline ? 'top' : 'center',
            includeFontPadding: false,
          }}
          placeholderTextColor="#999"
          secureTextEntry={isPasswordField && !showPassword}
          multiline={isMultiline || false}
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
