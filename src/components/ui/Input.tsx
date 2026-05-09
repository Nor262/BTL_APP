import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { styled } from 'nativewind';

const StyledTextInput = styled(TextInput);

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="mb-4 w-full">
      <Text className="text-sm font-semibold text-secondary-light mb-2 ml-1">{label}</Text>
      <StyledTextInput
        className={`bg-surface-muted px-4 py-4 rounded-xl border-2 ${error ? 'border-error' : 'border-transparent focus:border-primary'} text-secondary text-base`}
        placeholderTextColor="#999"
        {...props}
      />
      {error && <Text className="text-error text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}
