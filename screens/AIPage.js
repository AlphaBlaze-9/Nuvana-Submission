import React, { useRef, useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import NuvanaLogo from '../assets/Nuvana.png';
import BookIcon   from '../assets/Book.png';
import CheckIcon  from '../assets/Check.png';
import HomeIcon   from '../assets/Home.png';
import TextIcon   from '../assets/Text.png';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';

// === OpenAI setup (same style as your sample) ===
const API_KEY  = 'REDACTED';
const BASE_URL = 'https://api.openai.com/v1/chat/completions';

// Pet persona instructions (short, clear)
const PET_SYSTEM_PROMPT = `You are "Nuvana Pet", a warm, upbeat buddy. 
Keep replies 2–4 short sentences. Use 1–2 emojis max. 
Encourage healthy micro-habits (water, short break, breathing). 
Do not diagnose or give medical advice. 
If user mentions crisis or harm, say you're not a crisis service and suggest contacting trusted people or local hotlines.`;

const navIcons = [
  { key: 'Book',     src: BookIcon,  routeName: 'JournalPage' },
  { key: 'Check',    src: CheckIcon, routeName: 'ProgressPage' },
  { key: 'Home',     src: HomeIcon,  routeName: 'HomePage' },
  { key: 'Calendar', iconName: 'options-outline', routeName: 'CalendarPage' },
  { key: 'Text',     src: TextIcon,  routeName: 'AIPage' },
];

export default function AIPetPage() {
  const navigation = useNavigation();
  const route = useRoute();

  // Animation values
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const petBounce = useRef(new Animated.Value(0)).current;
  const petRotate = useRef(new Animated.Value(0)).current;
  const petScale = useRef(new Animated.Value(1)).current;
  const petGlow = useRef(new Animated.Value(0)).current;
  const speechBubbleScale = useRef(new Animated.Value(0)).current;
  const speechBubbleOpacity = useRef(new Animated.Value(0)).current;

  // State
  const [inputText, setInputText] = useState('');
  const [isPetThinking, setIsPetThinking] = useState(false);
  const [petMood, setPetMood] = useState('happy');
  const [aiResponse, setAiResponse] = useState("Hi! I'm your AI pet buddy! 🐾 Ask me anything!");

  // Navigation animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pet idle animation (continuous bounce and breathing effect)
  useEffect(() => {
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(petBounce, {
          toValue: -10,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(petBounce, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(petScale, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(petScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(petGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(petGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    bounceAnimation.start();
    breatheAnimation.start();
    glowAnimation.start();

    return () => {
      bounceAnimation.stop();
      breatheAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  // Pet wiggle when thinking
  useEffect(() => {
    if (isPetThinking) {
      const wiggle = Animated.loop(
        Animated.sequence([
          Animated.timing(petRotate, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(petRotate, {
            toValue: -1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(petRotate, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      );
      wiggle.start();
      return () => wiggle.stop();
    }
  }, [isPetThinking]);

  // Animate speech bubble when response changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(speechBubbleScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(speechBubbleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [aiResponse]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsPetThinking(true);
    setPetMood('thinking');

    // Pet excited animation when receiving message
    Animated.sequence([
      Animated.timing(petScale, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(petScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide speech bubble temporarily
    Animated.parallel([
      Animated.timing(speechBubbleScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(speechBubbleOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // === OpenAI call via axios (same pattern as your sample) ===
      const res = await axios.post(
        BASE_URL,
        {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 160,
          messages: [
            { role: 'system', content: PET_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const response =
        res?.data?.choices?.[0]?.message?.content?.trim() ||
        "I'm here for you! 💚";

      setAiResponse(response);
      setIsPetThinking(false);
      setPetMood('excited');

      // Pet celebration animation
      Animated.sequence([
        Animated.timing(petScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(petScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Return to happy after a moment
      setTimeout(() => setPetMood('happy'), 2000);
    } catch (e) {
      setIsPetThinking(false);
      setPetMood('happy');
      setAiResponse("Hmm, I couldn't reach my brain cloud. Can we try again? ☁️");
    }
  };

  const rotateInterpolate = petRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg']
  });

  const glowOpacity = petGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });

  // Pet emoji based on mood
  const getPetEmoji = () => {
    switch(petMood) {
      case 'thinking': return '🤔';
      case 'excited': return '🎉';
      default: return '😊';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <View style={styles.content}>
          {/* Pet Avatar Section */}
          <View style={styles.petSection}>
            <Animated.View style={[
              styles.petContainer,
              {
                transform: [
                  { translateY: petBounce },
                  { rotate: rotateInterpolate },
                  { scale: petScale }
                ]
              }
            ]}>
              {/* Glowing background effect */}
              <Animated.View style={[
                styles.glowCircle,
                { opacity: glowOpacity }
              ]} />
              
              {/* Pet with circular background */}
              <View style={styles.petCircle}>
                <Image source={NuvanaLogo} style={styles.petLogo} resizeMode="contain" />
                {/* Mood indicator */}
                <View style={styles.moodIndicator}>
                  <Text style={styles.moodEmoji}>{getPetEmoji()}</Text>
                </View>
              </View>
              
              {/* Floating hearts when excited */}
              {petMood === 'excited' && (
                <View style={styles.heartsContainer}>
                  <Text style={styles.floatingHeart}>💚</Text>
                  <Text style={[styles.floatingHeart, styles.heart2]}>💜</Text>
                  <Text style={[styles.floatingHeart, styles.heart3]}>💙</Text>
                </View>
              )}
              
              {isPetThinking && (
                <View style={styles.thinkingBubble}>
                  <Text style={styles.thinkingText}>...</Text>
                </View>
              )}
            </Animated.View>

            <Text style={styles.petName}>Nuvana Pet</Text>
            <Text style={styles.petStatus}>
              {isPetThinking ? '💭 Thinking...' : petMood === 'excited' ? '✨ Excited!' : '💚 Online'}
            </Text>
          </View>

          {/* AI Response Speech Bubble */}
          <Animated.View 
            style={[
              styles.speechBubble,
              {
                transform: [{ scale: speechBubbleScale }],
                opacity: speechBubbleOpacity,
              }
            ]}
          >
            <View style={styles.speechBubbleTriangle} />
            <Text style={styles.speechBubbleText}>{aiResponse}</Text>
          </Animated.View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Talk to your pet..."
              placeholderTextColor="#999"
              multiline
              maxLength={200}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={inputText.trim() === '' || isPetThinking}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom navigation */}
      <View style={styles.navBar}>
        {navIcons.map(({ key, src, iconName, routeName }) => {
          const isActive = route.name === routeName;
          if (isActive) {
            return (
              <Animated.View
                key={key}
                style={[
                  styles.navButton,
                  styles.activeNavButton,
                  { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                ]}
              >
                <TouchableOpacity onPress={() => navigation.navigate(routeName)}>
                  {iconName ? (
                    <Ionicons name={iconName} size={44} color={BG} />
                  ) : (
                    <Image
                      source={src}
                      style={[styles.navIcon, styles.activeNavIcon]}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }
          return (
            <TouchableOpacity
              key={key}
              onPress={() => navigation.navigate(routeName)}
              style={styles.navButton}
            >
              {iconName ? (
                <Ionicons name={iconName} size={44} color="#fff" />
              ) : (
                <Image source={src} style={styles.navIcon} resizeMode="contain" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BG 
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  petSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  petContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
  },
  petCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: CARD_BG,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: CARD_BG,
  },
  petLogo: { 
    width: 80, 
    height: 80,
  },
  moodIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  moodEmoji: {
    fontSize: 16,
  },
  heartsContainer: {
    position: 'absolute',
    top: -30,
    width: 150,
    height: 100,
    alignItems: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 24,
    top: 0,
  },
  heart2: {
    left: -20,
    top: 10,
  },
  heart3: {
    right: -20,
    top: 10,
  },
  thinkingBubble: {
    position: 'absolute',
    top: -10,
    right: -30,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  thinkingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CARD_BG,
  },
  petName: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#fff', 
    marginTop: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  petStatus: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    fontWeight: '600',
  },
  speechBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    minHeight: 100,
  },
  speechBubbleTriangle: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  speechBubbleText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    textAlign: 'center',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 5,
  },
  sendButton: {
    backgroundColor: CARD_BG,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  navBar: {
    position: 'absolute',
    bottom: 10,
    width,
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: CARD_BG,
    alignItems: 'center',
  },
  navButton: { 
    padding: 4 
  },
  navIcon: { 
    width: 44, 
    height: 44, 
    tintColor: '#fff' 
  },
  activeNavButton: { 
    backgroundColor: '#fff', 
    borderRadius: 28, 
    padding: 9 
  },
  activeNavIcon: { 
    tintColor: BG 
  },
});
