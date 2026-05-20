import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  containerClassName?: string;
  textClassName?: string;
  icon?: string;
}

export default function Button({
  onPress,
  title,
  loading,
  disabled,
  variant = 'primary',
  className = '',
  containerClassName = '',
  textClassName = '',
  icon
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
      default:
        return 'bg-gray-100';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
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
        className={`h-[52px] items-center justify-center rounded-[14px] ${getVariantStyles()} ${className}`}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? 'white' : '#CC0D00'} />
        ) : (
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className={`${getTextColor()} font-bold text-[15px] ${textClassName}`}>{title}</Text>
            {icon && <Feather name={icon as any} size={18} color={variant === 'primary' ? '#FFFFFF' : '#CC0D00'} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
