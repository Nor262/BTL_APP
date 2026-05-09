import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const StyledPressable = styled(Pressable);

interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export default function Button({ onPress, title, loading, variant = 'primary', className = '' }: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  if (variant === 'primary') {
    return (
      <Animated.View style={[animatedStyle, { width: '100%' }]}>
        <StyledPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={loading}
          className={`overflow-hidden rounded-xl ${className}`}
        >
          <LinearGradient
            colors={['#CC0D00', '#8B0000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg tracking-wider">{title.toUpperCase()}</Text>
            )}
          </LinearGradient>
        </StyledPressable>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={[animatedStyle, { width: '100%' }]}>
        <StyledPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={loading}
          className={`py-4 rounded-xl border-2 border-primary items-center justify-center ${className}`}
        >
          <Text className="text-primary font-bold text-lg tracking-wider">{title.toUpperCase()}</Text>
        </StyledPressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, { width: '100%' }]}>
      <StyledPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={loading}
        className={`py-4 rounded-xl bg-surface-muted items-center justify-center ${className}`}
      >
        <Text className="text-secondary font-bold text-lg tracking-wider">{title.toUpperCase()}</Text>
      </StyledPressable>
    </Animated.View>
  );
}
