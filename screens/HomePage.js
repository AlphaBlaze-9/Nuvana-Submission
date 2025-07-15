import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import NuvanaLogo from '../assets/Nuvana.png';
import BookIcon from '../assets/Book.png';
import CheckIcon from '../assets/Check.png';
import HomeIcon from '../assets/Home.png';
import CalendarIcon from '../assets/Calendar.png';
import TextIcon from '../assets/Text.png';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';
const CONTENT_BG = '#f3e7ff';

const API_KEY = '...';
const BASE_URL = 'https://api.openai.com/v1/chat/completions';

export default function HomePage() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    {
      id: '1',
      from: 'nova',
      text: 'Tell me about your day.',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [text, setText] = useState('');

  const homeIconAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleSend = async () => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      from: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages((m) => [...m, userMsg]);
    setText('');

    try {
      const response = await axios.post(
        BASE_URL,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a compassionate mental health assistant who listens and supports the user. Your role is to help the user express their thoughts and emotions freely. Avoid providing advice or solutions; instead, offer a space for the user to reflect on their day and experiences. Be empathetic, non-judgmental, and remember key details to create a sense of continuity in future conversations.',
            },
            { role: 'user', content: text.trim() },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botText = response.data.choices[0].message.content;
      setMessages((m) => [
        ...m,
        {
          id: Date.now().toString(),
          from: 'nova',
          text: botText,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not process your request. Please try again.');
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(homeIconAnim, {
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

  const navIcons = [
    { key: 'Book', src: BookIcon, onPress: () => navigation.navigate('JournalPage') },
    { key: 'Check', src: CheckIcon, onPress: () => navigation.navigate('ProgressPage') },
    { key: 'Home', src: HomeIcon, onPress: () => {} },
    { key: 'Calendar', src: CalendarIcon, onPress: () => navigation.navigate('CalendarPage') },
    { key: 'Text', src: TextIcon, onPress: () => navigation.navigate('AIPage') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.therapistBox}>
        <Ionicons name="call" size={16} color={BG} style={{ marginRight: 4 }} />
        <Text style={styles.therapistText}>
          Find a{'\n'}Therapist
        </Text>
      </View>

      <View style={styles.hotlineBox}>
        <Ionicons name="call" size={16} color={BG} style={{ marginRight: 4 }} />
        <Text style={styles.hotlineText}>
          Support{'\n'}Hotline
        </Text>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeText}>Welcome, Samarth</Text>

          <View style={styles.chatCard}>
            <Text style={styles.cardTitle}>Chat With Nova</Text>
            <ScrollView style={styles.chatContent} contentContainerStyle={styles.chatScroll}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.from === 'nova' ? styles.fromNova : styles.fromUser,
                  ]}
                >
                  {msg.from === 'nova' && <Image source={NuvanaLogo} style={styles.avatar} />}
                  <View
                    style={[
                      styles.bubble,
                      msg.from === 'nova' ? styles.bubbleNova : styles.bubbleUser,
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.text}</Text>
                    <Text style={styles.timestamp}>{msg.time}</Text>
                  </View>
                  {msg.from === 'user' && <View style={styles.avatarPlaceholder} />}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="happy-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type Something"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="paper-plane-outline" size={24} color={BG} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.navBar}>
        {navIcons.map(({ key, src, onPress }) => {
          const isActive = key === 'Home';
          return (
            <Animated.View
              key={key}
              style={[
                styles.navButton,
                isActive && styles.activeNavButton,
                isActive && { transform: [{ scale: homeIconAnim }], opacity: opacityAnim },
              ]}
            >
              <TouchableOpacity onPress={onPress}>
                <Image source={src} style={[styles.navIcon, isActive && { tintColor: BG }]} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  therapistBox: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: width * 0.4,
    alignItems: 'center',
    backgroundColor: CARD_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  therapistText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
    lineHeight: 16,
  },

  hotlineBox: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: width * 0.4,
    alignItems: 'center',
    backgroundColor: CARD_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  hotlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
    lineHeight: 16,
  },

  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logo: { width: 70, height: 70, marginTop: -75 },
  welcomeText: {
    marginTop: 0,
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  chatCard: {
    width: width - 32,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    height: 300,
    padding: 20,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  chatContent: {
    width: '100%',
    maxHeight: 380,
    backgroundColor: CONTENT_BG,
    borderRadius: 16,
    paddingVertical: 10,
  },
  chatScroll: { paddingVertical: 8 },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  fromNova: { justifyContent: 'flex-start' },
  fromUser: { flexDirection: 'row-reverse', justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 6 },
  avatarPlaceholder: { width: 32, height: 32, marginHorizontal: 6 },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 16 },
  bubbleNova: { backgroundColor: '#fff', borderTopLeftRadius: 0 },
  bubbleUser: { backgroundColor: BG, borderTopRightRadius: 0 },
  messageText: { fontSize: 14, color: '#333' },
  timestamp: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  inputWrapper: {
    position: 'absolute',
    marginTop: 480,
    width,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: width - 32,
  },
  iconButton: { padding: 4, marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  sendButton: {
    width: 36,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  navButton: { padding: 4 },
  navIcon: { width: 44, height: 44, tintColor: '#fff' },
  activeNavButton: { backgroundColor: '#fff', borderRadius: 28, padding: 9 },
});
