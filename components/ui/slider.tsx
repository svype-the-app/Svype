import { Colors } from '@/constants/theme';
import React, { useState } from 'react';
import { PanResponder, StyleSheet, useColorScheme, View } from 'react-native';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: any;
}

export function Slider({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1,
  style 
}: SliderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [sliderWidth, setSliderWidth] = useState(0);
  const currentValue = value[0] || min;
  
  const normalizedValue = ((currentValue - min) / (max - min)) * 100;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (sliderWidth === 0) return;
      
      const { locationX } = evt.nativeEvent;
      const percentage = Math.max(0, Math.min(100, (locationX / sliderWidth) * 100));
      const rawValue = min + (percentage / 100) * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));
      
      onValueChange([clampedValue]);
    },
    onPanResponderRelease: () => {},
  });

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width);
      }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.track, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${normalizedValue}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.thumb,
          {
            left: `${normalizedValue}%`,
            backgroundColor: colors.background,
            borderColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -10,
    marginTop: -8,
  },
});
