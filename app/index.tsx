import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface UserType {
  id: string;
  type: 'job-seeker' | 'company';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  signUpPath: string;
  loginPath: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const panVelocity = useRef(new Animated.Value(0)).current;
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const userTypes: UserType[] = useMemo(() => [
    {
      id: 'job-seeker',
      type: 'job-seeker',
      icon: 'person',
      title: "I'm Looking for a Job",
      description: 'Swipe through opportunities, get AI coaching, and land your dream role',
      signUpPath: '/(auth)/sign-up',
      loginPath: '/(auth)/login',
    },
    {
      id: 'company',
      type: 'company',
      icon: 'business',
      title: "I'm Hiring Talent",
      description: 'Post jobs, review applicants with swipe interface, and build your team',
      signUpPath: '/(auth)/company-sign-up',
      loginPath: '/(auth)/login',
    },
  ], []);

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }, [pan]);

  const animateCardSwitch = useCallback((direction: 'left' | 'right', callback: () => void) => {
    const slideOutValue = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const slideInValue = direction === 'left' ? SCREEN_WIDTH : -SCREEN_WIDTH;

    // Fade out and slide current card
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(pan.x, {
        toValue: slideOutValue,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Switch card
      callback();
      // Reset position off-screen in opposite direction
      pan.setValue({ x: slideInValue, y: 0 });
      // Fade in and slide new card
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(pan.x, {
          toValue: 0,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [cardOpacity, pan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only activate if there's significant horizontal movement
          return Math.abs(gestureState.dx) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
          pan.x.setValue(gestureState.dx);
          pan.y.setValue(gestureState.dy);
          // Track velocity for direction (positive = right, negative = left)
          panVelocity.setValue(gestureState.vx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > SWIPE_THRESHOLD) {
            // Swipe right - go to sign up
            router.push(userTypes[currentIndex].signUpPath as any);
            resetPosition();
          } else if (gestureState.dx < -SWIPE_THRESHOLD) {
            // Swipe left - animate out and switch to next card
            animateCardSwitch('left', () => {
              setCurrentIndex((prev) => (prev + 1) % userTypes.length);
            });
          } else {
            // Return to original position
            resetPosition();
          }
        },
      }),
    [currentIndex, router, userTypes, pan, animateCardSwitch, resetPosition]
  );

  const currentUserType = userTypes[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="briefcase" size={32} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>SVYPE</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            AI-powered job hunting platform. Swipe your way to your dream career.
          </Text>
        </View>

        {/* Card Type Indicator */}
        <View style={styles.indicatorContainer}>
          {userTypes.map((type, index) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => {
                if (index !== currentIndex) {
                  const direction = index > currentIndex ? 'left' : 'right';
                  animateCardSwitch(direction, () => setCurrentIndex(index));
                }
              }}
              style={[
                styles.indicator,
                { backgroundColor: colors.border },
                index === currentIndex && [styles.indicatorActive, { backgroundColor: colors.primary }],
              ]}
            />
          ))}
        </View>

        {/* Swipeable Card */}
        <View style={styles.cardContainer}>
          <Animated.View
            style={{
              transform: [{ translateX: pan.x }, { rotate }],
              opacity: cardOpacity,
            }}
            {...panResponder.panHandlers}
          >
            {/* Swipe Right Overlay (Green - Sign Up) */}
            <Animated.View
              style={[
                styles.swipeOverlay,
                styles.swipeOverlayRight,
                {
                  opacity: pan.x.interpolate({
                    inputRange: [0, 50, 100],
                    outputRange: [0, 0.5, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.swipeIconRight}>
                <Ionicons name="arrow-forward" size={48} color="#fff" />
              </View>
            </Animated.View>

            {/* Swipe Left Overlay (Blue - Next Card) */}
            <Animated.View
              style={[
                styles.swipeOverlay,
                styles.swipeOverlayLeft,
                {
                  opacity: pan.x.interpolate({
                    inputRange: [-100, -50, 0],
                    outputRange: [1, 0.5, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.swipeIconLeft}>
                <Ionicons name="chevron-back" size={48} color="#fff" />
              </View>
            </Animated.View>

            <Card>
              <CardContent style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
                  <Ionicons name={currentUserType.icon} size={28} color={colors.foreground} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>{currentUserType.title}</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>{currentUserType.description}</Text>
                <View style={styles.buttonContainer}>
                  <Button
                    size="lg"
                    onPress={() => router.push(currentUserType.signUpPath as any)}
                    style={styles.getStartedButton}
                  >
                    Get Started →
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onPress={() => router.push(currentUserType.loginPath as any)}
                  >
                    Log In
                  </Button>
                </View>
              </CardContent>
            </Card>
          </Animated.View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: colors.mutedForeground }]}>
            Swipe right to Register • Swipe left to switch
          </Text>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              onPress={() => {
                animateCardSwitch('right', () => {
                  setCurrentIndex((prev) => (prev - 1 + userTypes.length) % userTypes.length);
                });
              }}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
              <Text style={[styles.navButtonText, { color: colors.mutedForeground }]}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                animateCardSwitch('left', () => {
                  setCurrentIndex((prev) => (prev + 1) % userTypes.length);
                });
              }}
              style={styles.navButton}
            >
              <Text style={[styles.navButtonText, { color: colors.mutedForeground }]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 400,
    paddingHorizontal: 16,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    width: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 50,
    height: 380,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  swipeOverlayRight: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  swipeOverlayLeft: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  swipeIconRight: {
    padding: 16,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    transform: [{ rotate: '12deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  swipeIconLeft: {
    padding: 16,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    transform: [{ rotate: '-12deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardContent: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  getStartedButton: {
    width: '100%',
  },
  instructions: {
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 32,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navButtonText: {
    fontSize: 12,
  },
});
