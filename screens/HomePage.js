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
  Modal,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import NuvanaLogo from '../assets/Nuvana.png';
import BookIcon   from '../assets/Book.png';
import CheckIcon  from '../assets/Check.png';
import HomeIcon   from '../assets/Home.png';
import TextIcon   from '../assets/Text.png';

const { width }           = Dimensions.get('window');
const BG                  = '#a8e6cf';
const CARD_BG             = '#d3c6f1';
const CONTENT_BG          = '#f3e7ff';
const API_KEY             = '...';
const BASE_URL            = 'https://api.openai.com/v1/chat/completions';
const SHEETS_WEBHOOK_URL  = 'https://script.google.com/macros/s/AKfycbz0XpvknugZlGoelhg-n2QLkXwBThcKDChrINzjwE-m7M4gqkR043BsWr4Fv1pxW9XFkg/exec';
const DANGER_REGEX        = /\b(suicid|die|kill|harm|self-?harm|overdose|unsafe|danger|hopeless)\b/i;

export default function HomePage() {
  const navigation           = useNavigation();
  const route                = useRoute();
  const [username, setUsername]         = useState(route.params?.username || '');
  const [messages, setMessages]         = useState([{
    id:   '1',
    from: 'nova',
    text: 'Tell me about your day.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [text, setText]                 = useState('');
  const [urgentModalVisible, setUrgent] = useState(false);
  const [loading, setLoading]           = useState(false);

  const homeIconAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim    = useRef(new Animated.Value(0)).current;
  const scrollViewRef  = useRef(null);
  const lastSummIndex  = useRef(-1);
  const uploadingRef   = useRef(false);

  useEffect(() => {
    if (!username) {
      AsyncStorage.getItem('username').then(u => u && setUsername(u));
    }
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg = {
      id:   Date.now().toString(),
      from: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(m => [...m, newMsg]);
    setText('');
    if (DANGER_REGEX.test(newMsg.text)) setUrgent(true);
  };

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== 'user') return;
    (async () => {
      try {
        const res = await axios.post(
          BASE_URL,
          {
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a compassionate mental health assistant... no advice, just reflection.' },
              { role: 'user', content: last.text },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const botText = res.data.choices[0].message.content;
        setMessages(m => [...m, {
          id:   Date.now().toString(),
          from: 'nova',
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      } catch {
        Alert.alert('Error', 'Could not process your request.');
      }
    })();
  }, [messages]);

  useEffect(() => {
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
  }, [messages]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(homeIconAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
      Animated.timing(opacityAnim,  { toValue: 1,   duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      summarizeAndUpload(messages.length - 1);
    });
    return unsub;
  }, [messages, navigation]);

  const summarizeAndUpload = async latestIdx => {
    if (uploadingRef.current || latestIdx <= lastSummIndex.current) return;
    const userTexts = messages
      .filter((m,i) => m.from==='user' && i<=latestIdx)
      .map(m => m.text)
      .join('\n\n');
    if (!userTexts.trim()) return;
    uploadingRef.current = true;
    try {
      const sumRes = await axios.post(
        BASE_URL,
        {
          model: 'gpt-3.5-turbo',
          temperature: 0.4,
          max_tokens: 180,
          messages: [
            { role: 'system', content: 'Summarize emotional themes neutrally, 3–5 sentences, start “Summary:”' },
            { role: 'user', content: userTexts },
          ],
        },
        { headers:{ Authorization:`Bearer ${API_KEY}`, 'Content-Type':'application/json' } }
      );
      const summary = sumRes.data.choices[0].message.content;
      await fetch(SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:  username||'Unknown',
          timestamp: new Date().toISOString(),
          dateKey:   new Date().toISOString().slice(0,10),
          summary,
        }),
      });
      lastSummIndex.current = latestIdx;
      if (DANGER_REGEX.test(summary)) setUrgent(true);
    } catch (e) {
      console.error(e);
    } finally {
      uploadingRef.current = false;
    }
  };

  const closeUrgent = () => setUrgent(false);

  const navIcons = [
    { key:'Book',  src:BookIcon, onPress:()=>navigation.navigate('JournalPage') },
    { key:'Check', src:CheckIcon,onPress:()=>navigation.navigate('ProgressPage') },
    { key:'Home',  src:HomeIcon, onPress:()=>{} },
    { key:'Cal',   iconName:'options-outline', onPress:()=>navigation.navigate('CalendarPage') },
    { key:'Text',  src:TextIcon, onPress:()=>navigation.navigate('AIPage') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={urgentModalVisible} transparent animationType="slide">
        <View style={styles.urgentOverlay}>
          <View style={styles.urgentCard}>
            <Text style={styles.urgentTitle}>Urgent Response Toolkit</Text>
            <ScrollView>
              <TouchableOpacity style={styles.urgentButton}>
                <Text style={styles.urgentButtonText}>📋 Log & Review Personal Cues</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.urgentButton}>
                <Text style={styles.urgentButtonText}>🧘 Breathing & Grounding Exercises</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.urgentButton}>
                <Text style={styles.urgentButtonText}>📞 Call/Message an Accountability Buddy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.urgentButton}>
                <Text style={styles.urgentButtonText}>✍️ Reflection Journal</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.urgentClose} onPress={closeUrgent}>
              <Text style={styles.urgentCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.therapistBox}>
        <Ionicons name="call" size={16} color={BG} />
        <Text style={styles.therapistText}>Find a{"\n"}Therapist</Text>
      </View>
      <View style={styles.hotlineBox}>
        <Ionicons name="call" size={16} color={BG} />
        <Text style={styles.hotlineText}>Support{"\n"}Hotline</Text>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeText}>Welcome</Text>
          <View style={styles.chatCard}>
            <Text style={styles.cardTitle}>Chat With Nova</Text>
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatContent}
              contentContainerStyle={styles.chatScroll}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.from==='nova' ? styles.fromNova : styles.fromUser
                  ]}
                >
                  {msg.from==='nova' && <Image source={NuvanaLogo} style={styles.avatar} />}
                  <View style={[
                    styles.bubble,
                    msg.from==='nova' ? styles.bubbleNova : styles.bubbleUser
                  ]}>
                    <Text style={styles.messageText}>{msg.text}</Text>
                    <Text style={styles.timestamp}>{msg.time}</Text>
                  </View>
                  {msg.from==='user' && <View style={styles.avatarPlaceholder} />}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* === Daily Wellness Summary Card (added) === */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Ionicons name="sunny-outline" size={32} color="#fff" />
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryTitle}>Daily Wellness</Text>
              <Text style={styles.summaryText}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return "☀️ Start your day with gratitude and a deep breath.";
                  if (hour < 18) return "🌿 Stay hydrated and take a mindful 2-minute stretch.";
                  return "🌙 Wind down — write one good thing about today before bed.";
                })()}
              </Text>
            </View>
          </View>
          {/* === End Daily Wellness Summary Card === */}
        </View>
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS==='ios'?'padding':'height'}
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
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="paper-plane-outline" size={24} color={BG} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.navBar}>
        {navIcons.map(({ key, src, iconName, onPress }) => {
          const isActive = key==='Home';
          return (
            <Animated.View
              key={key}
              style={[
                styles.navButton,
                isActive && styles.activeNavButton,
                isActive && { transform:[{ scale: homeIconAnim }], opacity: opacityAnim }
              ]}
            >
              <TouchableOpacity onPress={onPress}>
                {iconName
                  ? <Ionicons name={iconName} size={44} color={isActive?BG:'#fff'} />
                  : <Image source={src} style={[styles.navIcon, isActive&&{ tintColor: BG }]} />
                }
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: BG },
  urgentOverlay:  {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentCard:     {
    width: width * 0.85,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  urgentTitle:    { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  urgentButton:   { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#ddd' },
  urgentButtonText:{ fontSize: 16, color: '#333' },
  urgentClose:    {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: CARD_BG,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  urgentCloseText:{ color: '#fff', fontSize: 16 },

  therapistBox:   {
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
  therapistText: { color: '#fff', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline', textAlign: 'center', lineHeight: 16 },
  hotlineBox:     {
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
  hotlineText:   { color: '#fff', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline', textAlign: 'center', lineHeight: 16 },

  content:        { flex: 1, paddingTop: 60, paddingHorizontal: 16, alignItems: 'center' },
  logo:           { width: 70, height: 70, marginTop: -60 },
  welcomeText:    { fontSize: 40, fontWeight: '700', color: '#fff', textAlign: 'center', width: '100%' },

  chatCard:       { width: width - 32, backgroundColor: CARD_BG, borderRadius: 24, height: 300, padding: 20, marginTop: 10 },
  cardTitle:      { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  chatContent:    { width: '100%', flexGrow: 1, backgroundColor: CONTENT_BG, borderRadius: 16, paddingVertical: 10 },
  chatScroll:     { paddingVertical: 8 },

  messageContainer:{ flexDirection: 'row', alignItems: 'flex-end', marginVertical: 4, paddingHorizontal: 8 },
  fromNova:       { justifyContent: 'flex-start' },
  fromUser:       { flexDirection: 'row-reverse', justifyContent: 'flex-end' },
  avatar:         { width: 32, height: 32, borderRadius: 16, marginHorizontal: 6 },
  avatarPlaceholder: { width: 32, height: 32, marginHorizontal: 6 },

  bubble:         { maxWidth: '75%', padding: 10, borderRadius: 16 },
  bubbleNova:     { backgroundColor: '#fff', borderTopLeftRadius: 0 },
  bubbleUser:     { backgroundColor: BG, borderTopRightRadius: 0 },
  messageText:    { fontSize: 14, color: '#333' },
  timestamp:      { fontSize: 10, color: '#666', alignSelf: 'flex-end', marginTop: 4 },

  /* 🌿 New Daily Wellness Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginTop: 130,
    width: width - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  summaryLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryRight: { flex: 1 },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#f8f8f8',
    lineHeight: 20,
  },

  inputWrapper:   { position: 'absolute', bottom: 320, width, alignItems: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 12, width: width - 32 },
  iconButton:     { padding: 4, marginRight: 8 },
  input:          { flex: 1, color: '#fff', fontSize: 16 },
  sendButton:     { width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  navBar:         { position: 'absolute', bottom: 10, width, height: 90, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: CARD_BG, alignItems: 'center' },
  navButton:      { padding: 4 },
  navIcon:        { width: 44, height: 44, tintColor: '#fff' },
  activeNavButton:{ backgroundColor: '#fff', borderRadius: 28, padding: 9 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
});
