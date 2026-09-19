import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

const STORAGE_KEY = 'magic_book_v51_intro_seen';

async function readSeen(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return (globalThis as any)?.localStorage?.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
}

async function writeSeen(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      (globalThis as any)?.localStorage?.setItem(STORAGE_KEY, '1');
      return;
    } catch {
      // Native fallback below.
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

export default function IntroVideo({
  onComplete,
}: {
  onComplete(): void;
}) {
  const [loadedPreference, setLoadedPreference] = useState(false);
  const [returningVisitor, setReturningVisitor] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const progressRef = useRef(0);

  const videoSource = useMemo(() => require('../../splash-video.mp4'), []);

  const player = useVideoPlayer(videoSource, (instance) => {
    instance.loop = false;

    // Mobile browsers commonly block autoplay when audio is enabled.
    // Web starts muted so the intro always launches automatically.
    instance.muted = Platform.OS === 'web';

    try {
      instance.play();
    } catch {
      // The watchdog below exposes a safe continue action if a browser blocks playback.
    }
  });

  useEffect(() => {
    let mounted = true;

    void readSeen().then((seen) => {
      if (!mounted) return;

      setReturningVisitor(seen);
      setLoadedPreference(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedPreference) return;

    // Returning visitors always get the premium instant-skip action.
    if (returningVisitor) {
      setFallbackVisible(true);
      return;
    }

    // First visit: give autoplay time to begin. If the browser still blocks it,
    // expose a recovery CTA so the app can never be trapped on the intro screen.
    const watchdog = setTimeout(() => {
      const current = Number(player.currentTime || 0);

      if (current <= progressRef.current + 0.05) {
        setFallbackVisible(true);
      }
    }, 3500);

    return () => clearTimeout(watchdog);
  }, [loadedPreference, player, returningVisitor]);

  useEffect(() => {
    if (!loadedPreference || returningVisitor || finishing) return;

    const timer = setInterval(() => {
      const duration = Number(player.duration || 0);
      const current = Number(player.currentTime || 0);

      if (current > progressRef.current) {
        progressRef.current = current;
      }

      if (duration > 0 && current >= Math.max(duration - 0.3, 0)) {
        clearInterval(timer);
        setFinishing(true);

        void writeSeen().finally(() => {
          setTimeout(onComplete, 300);
        });
      }
    }, 200);

    return () => clearInterval(timer);
  }, [finishing, loadedPreference, onComplete, player, returningVisitor]);

  async function continueToApp() {
    try {
      player.pause();
    } catch {
      // Playback may already be stopped.
    }

    await writeSeen();
    onComplete();
  }

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlay} />

      <View style={styles.brand}>
        <Image
          source={require('../../footer-logo.png')}
          resizeMode="contain"
          style={styles.logo as any}
        />
        <Text style={styles.signature}>MAGIC APP PRODUCTION</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>MAGIC BOOK POWERSPORTS V5.1</Text>
        <Text style={styles.title}>La passion rencontre l'intelligence.</Text>
        <Text style={styles.subtitle}>
          Motoneige · VTT · Côte-à-côte · Motomarine · Moto · Marine
        </Text>
      </View>

      {fallbackVisible ? (
        <Pressable
          accessibilityRole="button"
          onPress={continueToApp}
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Passer à l'application ✨</Text>
        </Pressable>
      ) : (
        <View style={styles.firstVisitBadge}>
          <Text style={styles.firstVisitText}>Première découverte · lecture complète</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#05070A',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3,5,8,0.46)',
  },
  brand: {
    position: 'absolute',
    top: 38,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  logo: {
    width: 210,
    height: 110,
  },
  signature: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.4,
    marginTop: 4,
  },
  copy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 116,
    maxWidth: 760,
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 9,
  },
  subtitle: {
    color: '#D8DCE5',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 12,
  },
  skip: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(10,13,20,0.92)',
  },
  skipText: {
    color: '#F5DE8B',
    fontWeight: '900',
  },
  firstVisitBadge: {
    position: 'absolute',
    left: 22,
    bottom: 28,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(10,13,20,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
  },
  firstVisitText: {
    color: '#E5E8ED',
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
