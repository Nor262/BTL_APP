import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'success';
  className?: string;
  containerClassName?: string;
  textClassName?: string;
}

export default function Button({ 
  onPress, 
  title, 
  loading, 
  disabled, 
  variant = 'primary', 
  className = '', 
  containerClassName = '',
  textClassName = '' 
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled || loading ? 0.6 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary';
      case 'outline':
        return 'border border-primary bg-transparent';
      case 'secondary':
        return 'bg-gray-100';
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      case 'success':
        return 'bg-green-600';
      default:
        return 'bg-gray-100';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'warning':
      case 'success':
        return 'text-white';
      case 'outline':
        return 'text-primary';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <Animated.View style={animatedStyle} className={`w-full ${containerClassName}`}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={loading || disabled}
        className={`py-4 items-center justify-center rounded-xl ${getVariantStyles()} ${className}`}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? 'white' : '#CC0D00'} />
        ) : (
          <Text className={`${getTextColor()} font-bold text-base ${textClassName}`}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
