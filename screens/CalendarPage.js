import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import NuvanaLogo from '../assets/Nuvana.png';
import BookIcon   from '../assets/Book.png';
import CheckIcon  from '../assets/Check.png';
import HomeIcon   from '../assets/Home.png';
import TextIcon   from '../assets/Text.png';

const { width } = Dimensions.get('window');
const BG      = '#a8e6cf';
const CARD_BG = '#d3c6f1';

const API_KEY  = '...';
const BASE_URL = 'https://api.openai.com/v1/chat/completions';
const SHEETS_READ_URL = 'https://script.google.com/macros/s/AKfycbwfD5bwgqxVMQ6pm29Yjgfzg60MTPSFGxKlg0LwWL-7vj7tF37DCGcaBIIaRhCFNonmWw/exec';

const MAX_ITEM_CHARS = 80;
const CACHE_TTL_MS   = 5 * 60 * 60 * 1000;

const normalizeItems = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) =>
    typeof it === 'string'
      ? { text: it, done: false }
      : { text: it.text ?? '', done: !!it.done }
  ).filter((it) => it.text);

export default function CalendarPage() {
  const navigation = useNavigation();
  const route      = useRoute();

  const [username, setUsername]    = useState(route.params?.username || '');
  const [usernameReady, setUReady] = useState(!!route.params?.username);

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (username) {
      setUReady(true);
      return;
    }
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('username');
        if (stored) setUsername(stored);
      } finally {
        setUReady(true);
      }
    })();
  }, [username]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  useEffect(() => {
    if (!usernameReady) return;
    if (!username) {
      setError('No username found');
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const dateKey   = new Date().toISOString().slice(0, 10);
        const cacheKey  = `suggestions:${username}:${dateKey}`;
        const cachedRaw = await AsyncStorage.getItem(cacheKey);

        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.items && cached?.ts && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            setSuggestions(normalizeItems(cached.items));
            setLoading(false);
            return;
          }
        }

        const res  = await fetch(`${SHEETS_READ_URL}?username=${encodeURIComponent(username)}`);
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          console.warn('Sheets returned non-JSON:\n', text);
          throw new Error('Sheets endpoint did not return JSON');
        }
        if (!json.ok || !json.summary) throw new Error('No summary found for user.');
        const summary = json.summary;

        const completion = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            temperature: 0.4,
            max_tokens: 180,
            messages: [
              {
                role: 'system',
                content:
`You are a mental-health support assistant.
Given a brief emotional summary, suggest 5 short, concrete, healthy coping activities.
Hard requirements:
- Each item <= 60 characters, 1 concise action.
- No explanations or numbering.
Return ONLY a valid JSON array of strings.`,
              },
              { role: 'user', content: `Summary:\n${summary}\n\nReturn 5 items.` },
            ],
          }),
        });

        const data  = await completion.json();
        let textOut = data?.choices?.[0]?.message?.content ?? '[]';
        textOut     = textOut.replace(/```json|```/gi, '').trim();

        let rawList = [];
        try {
          rawList = JSON.parse(textOut);
        } catch {
          rawList = textOut
            .split('\n')
            .map(t => t.replace(/^\s*[-•\d.]+\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 5);
        }

        const clipped = (Array.isArray(rawList) ? rawList : []).map(s =>
          s.length > MAX_ITEM_CHARS ? s.slice(0, MAX_ITEM_CHARS - 1) + '…' : s
        );

        const items = normalizeItems(clipped);
        setSuggestions(items);
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ items, ts: Date.now() }));
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [usernameReady, username]);

  const toggleDone = async (index) => {
    try {
      const dateKey  = new Date().toISOString().slice(0, 10);
      const cacheKey = `suggestions:${username}:${dateKey}`;

      const updated = suggestions.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item
      );
      setSuggestions(updated);

      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      let ts = Date.now();
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached?.ts) ts = cached.ts;
      }
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ items: updated, ts }));
    } catch (e) {
      console.log('toggle error', e);
    }
  };

  const navIcons = [
    { key: 'Book',     src: BookIcon,  routeName: 'JournalPage' },
    { key: 'Check',    src: CheckIcon, routeName: 'ProgressPage' },
    { key: 'Home',     src: HomeIcon,  routeName: 'HomePage' },
    { key: 'Calendar', iconName: 'options-outline', routeName: 'CalendarPage' },
    { key: 'Text',     src: TextIcon,  routeName: 'AIPage' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.therapistBox}
        onPress={() => navigation.navigate('TherapistPage')}
        activeOpacity={0.8}
      >
        <Ionicons name="call" size={16} color={BG} style={{ marginRight: 4 }} />
        <Text style={styles.therapistText}>Find a{'\n'}Therapist</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.hotlineBox}
        onPress={() => Linking.openURL('tel:988')}
        activeOpacity={0.8}
      >
        <Ionicons name="call" size={16} color={BG} style={{ marginRight: 4 }} />
        <Text style={styles.hotlineText}>Support{'\n'}Hotline</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Your Craving Controller</Text>

        <View style={styles.singleBoxWrap}>
          <View style={styles.cardBox}>
            <Text style={styles.boxHeading}>Try out one of the following:</Text>

            {(!usernameReady || loading) && (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color="#fff" />
              </View>
            )}

            {usernameReady && !loading && error && (
              <Text style={styles.bulletItem}>Couldn’t load suggestions: {error}</Text>
            )}

            {usernameReady && !loading && !error && suggestions.length === 0 && (
              <Text style={styles.bulletItem}>No suggestions available yet.</Text>
            )}

            {usernameReady && !loading && !error && suggestions.length > 0 && (
              <View style={styles.bulletList}>
                {suggestions.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.checkRow}
                    onPress={() => toggleDone(i)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.done ? 'checkbox-outline' : 'square-outline'}
                      size={22}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.bulletItem,
                        item.done && { textDecorationLine: 'line-through', opacity: 0.6 },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.navBar}>
        {navIcons.map(({ key, src, iconName, routeName }) => {
          const isActive = route.name === routeName;
          const onPress  = () => navigation.navigate(routeName, { username });

          const IconNode = iconName ? (
            <Ionicons name={iconName} size={44} color={isActive ? BG : '#fff'} />
          ) : (
            <Image source={src} style={[styles.navIcon, isActive && { tintColor: BG }]} resizeMode="contain" />
          );

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
                <TouchableOpacity onPress={onPress}>{IconNode}</TouchableOpacity>
              </Animated.View>
            );
          }

          return (
            <View key={key} style={styles.navButton}>
              <TouchableOpacity onPress={onPress}>{IconNode}</TouchableOpacity>
            </View>
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

  scrollContent: { paddingBottom: 100, alignItems: 'center', paddingTop: 60 },
  logo: { width: 70, height: 70, marginTop: -60, marginBottom: 5 },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
  },

  singleBoxWrap: { width: width - 32, marginTop: 20 },
  cardBox: { backgroundColor: CARD_BG, borderRadius: 24, padding: 16 },
  boxHeading: {
    color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 8, textDecorationLine: 'underline',
  },
  bulletList: { paddingLeft: 8 },
  bulletItem: { color: '#fff', fontSize: 14, lineHeight: 20, flexShrink: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, paddingRight: 8 },

  navBar: {
    position: 'absolute', bottom: 10, width, height: 90,
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: CARD_BG, alignItems: 'center',
  },
  navButton: { padding: 4 },
  navIcon: { width: 44, height: 44, tintColor: '#fff' },
  activeNavButton: { backgroundColor: '#fff', borderRadius: 28, padding: 9 },
});
