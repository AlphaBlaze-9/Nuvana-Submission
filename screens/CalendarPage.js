import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  RefreshControl,
  TextInput,
  Vibration,
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

// ❗ Move this key server-side ASAP. Never ship real keys in client apps.
const API_KEY  = '...';
const BASE_URL = 'https://api.openai.com/v1/chat/completions';

// Your existing Apps Script endpoint (supports GET summary; we’ll POST events too)
const SHEETS_READ_URL  = 'https://script.google.com/macros/s/AKfycbz0XpvknugZlGoelhg-n2QLkXwBThcKDChrINzjwE-m7M4gqkR043BsWr4Fv1pxW9XFkg/exec';
const SHEETS_WRITE_URL = SHEETS_READ_URL;

const MAX_ITEM_CHARS = 80;
const CACHE_TTL_MS   = 12 * 60 * 60 * 1000; // 12h

const normalizeItems = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) =>
    typeof it === 'string'
      ? { text: it, done: false }
      : { text: it.text ?? '', done: !!it.done }
  ).filter((it) => it.text);

// Simple shimmer placeholder
const Shimmer = () => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 1, 0.35] });
  return <Animated.View style={{ height: 18, borderRadius: 6, backgroundColor: '#ffffff55', marginVertical: 8, opacity }} />;
};

export default function CalendarPage() {
  const navigation = useNavigation();
  const route      = useRoute();

  const [username, setUsername]    = useState(route.params?.username || '');
  const [usernameReady, setUReady] = useState(!!route.params?.username);

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [isLogging, setIsLogging]     = useState(false);

  const [refreshing, setRefreshing]   = useState(false);
  const [refreshes, setRefreshes]     = useState(0);

  // Routine editor
  const [editIndex, setEditIndex] = useState(-1);
  const [editText, setEditText]   = useState('');

  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const CACHE_KEY = `ccCache:${username}`;
  const ROUTINE_KEY = `routine:${username}`;

  // Load username from storage if not passed in.
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

  // Icon pop animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim,   { toValue: 1.3, duration: 500, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // Load from cache instantly, then fetch fresh
  useEffect(() => {
    if (!usernameReady || !username) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const { at, items } = JSON.parse(raw);
          if (items?.length) setSuggestions(normalizeItems(items));
          // Stale? silently refresh
          if (!at || (Date.now() - at) > CACHE_TTL_MS) {
            fetchSuggestions().catch(()=>{});
          } else {
            setLoading(false);
          }
        } else {
          // no cache, fetch now
          fetchSuggestions().catch(()=>{});
        }
      } catch {
        fetchSuggestions().catch(()=>{});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameReady, username]);

  // Fetch suggestions (summary -> OpenAI -> 5 items)
  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Get user emotional summary from Sheets
      const res  = await fetch(`${SHEETS_READ_URL}?username=${encodeURIComponent(username)}`);
      const text = await res.text();

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Sheets endpoint did not return JSON');
      }
      if (!json.ok || !json.summary) throw new Error('No summary found for user.');
      const summary = json.summary;

      // 2) Ask OpenAI for 5 short coping items
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

      const norm = normalizeItems(clipped);
      setSuggestions(norm);
      // cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items: norm }));
    } catch (err) {
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Optional second fetch pass (keeps your original "twice" intent)
  useEffect(() => {
    if (!usernameReady) return;
    if (!username) {
      setError('No username found');
      setLoading(false);
      return;
    }
    if (refreshes < 1) {
      fetchSuggestions().finally(() => setRefreshes(r => r + 1));
    }
  }, [usernameReady, username, refreshes, fetchSuggestions]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSuggestions().catch(()=>{});
    setRefreshing(false);
  };

  // Toggle check state + light vibration (fallback for haptics)
  const toggleDone = (index) => {
    setSuggestions(prev =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
    Vibration.vibrate(10);
  };

  // Edit inline (save)
  const saveEdited = () => {
    if (editIndex < 0) return;
    setSuggestions(prev => prev.map((it, i) =>
      i === editIndex ? { ...it, text: (editText || '').slice(0, MAX_ITEM_CHARS) } : it
    ));
    setEditIndex(-1);
    setEditText('');
  };

  // Derive checked items
  const checked = suggestions.filter(s => s.done);

  // Save as / Load routine
  const saveRoutine = async () => {
    const r = suggestions.map(s => ({ text: s.text, done: false }));
    await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(r));
  };
  const loadRoutine = async () => {
    const raw = await AsyncStorage.getItem(ROUTINE_KEY);
    if (raw) setSuggestions(normalizeItems(JSON.parse(raw)));
  };

  // POST a single daily "event" to Sheets so ProgressPage can analyze it
  const logCompletedToday = async () => {
    try {
      if (checked.length === 0) return;
      setIsLogging(true);

      // Prevent duplicate daily logs per user
      const todayKey = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      const dupeKey  = `ccLogged:${username}:${todayKey}`;
      const already  = await AsyncStorage.getItem(dupeKey);
      if (already) {
        setIsLogging(false);
        setError('Already logged today. You can update again tomorrow.');
        return;
      }

      const event = {
        ts: new Date().toISOString(),
        activity: ['Craving Controller'],
        location_type: 'app',
        coping_used: checked.map(c => c.text),
        success: true, // counts toward streak/score in ProgressPage
      };

      const res = await fetch(SHEETS_WRITE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'logEvent',
          username,
          event,
        }),
      });

      const out = await res.json().catch(() => ({}));
      if (!out?.ok) throw new Error(out?.error || 'Failed to save');

      // Mark as logged & clear checks
      await AsyncStorage.setItem(dupeKey, '1');
      setSuggestions(prev => prev.map(it => ({ ...it, done: false })));

      // Jump to Progress to show the update
      navigation.navigate('ProgressPage', { username });
    } catch (e) {
      setError(e.message || 'Could not save your progress');
    } finally {
      setIsLogging(false);
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Your Craving Controller</Text>

        <View style={styles.singleBoxWrap}>
          <View style={styles.cardBox}>
            <Text style={styles.boxHeading}>Try out one of the following:</Text>

            {/* Regenerate suggestions */}
            <TouchableOpacity onPress={fetchSuggestions} style={{ alignSelf:'flex-start', marginBottom: 4 }} activeOpacity={0.8}>
              <Text style={{ color:'#fff', textDecorationLine:'underline' }}>↻ Regenerate suggestions</Text>
            </TouchableOpacity>

            {(!usernameReady || loading) && (
              <View style={{ paddingVertical: 12 }}>
                <Shimmer /><Shimmer /><Shimmer /><Shimmer /><Shimmer />
              </View>
            )}

            {usernameReady && !loading && error && (
              <View style={{ backgroundColor:'#00000022', padding:10, borderRadius:12, marginTop:8 }}>
                <Text style={[styles.bulletItem, { marginBottom:8 }]}>Couldn’t load suggestions: {error}</Text>
                <TouchableOpacity onPress={fetchSuggestions} style={[styles.logBtn, { alignSelf:'flex-start' }]} activeOpacity={0.8}>
                  <Text style={styles.logBtnText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}

            {usernameReady && !loading && !error && suggestions.length === 0 && (
              <Text style={styles.bulletItem}>No suggestions available yet.</Text>
            )}

            {usernameReady && !loading && !error && suggestions.length > 0 && (
              <>
                {/* Today progress chips */}
                <View style={{ flexDirection:'row', alignItems:'center', marginBottom: 2 }}>
                  <Text style={{ color:'#fff', marginRight:8 }}>{checked.length}/{suggestions.length} done</Text>
                  <TouchableOpacity onPress={()=>setSuggestions(prev=>prev.map(it=>({ ...it, done:false })))}>
                    <Text style={{ color:'#fff', textDecorationLine:'underline' }}>Clear checks</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bulletList}>
                  {suggestions.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.checkRow}
                      onPress={() => toggleDone(i)}
                      onLongPress={() => { setEditIndex(i); setEditText(suggestions[i].text); }}
                      delayLongPress={250}
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

                {/* Inline quick editor */}
                {editIndex >= 0 && (
                  <View style={styles.editorCard}>
                    <Text style={{ color:'#fff', marginBottom:6 }}>Edit item</Text>
                    <View style={styles.editorInputWrap}>
                      <TextInput
                        style={styles.editorInput}
                        value={editText}
                        onChangeText={setEditText}
                        placeholder="Edit suggestion"
                        placeholderTextColor="#999"
                        maxLength={MAX_ITEM_CHARS}
                      />
                    </View>
                    <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
                      <TouchableOpacity style={[styles.logBtn, { backgroundColor:'#fff' }]} onPress={saveEdited} activeOpacity={0.8}>
                        <Text style={styles.logBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={()=>{ setEditIndex(-1); setEditText(''); }}>
                        <Text style={{ color:'#fff', textDecorationLine:'underline', paddingVertical:10 }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Save/Load routine */}
                <View style={{ flexDirection:'row', gap:14, marginTop:10 }}>
                  <TouchableOpacity onPress={saveRoutine} activeOpacity={0.8}>
                    <Text style={{ color:'#fff', textDecorationLine:'underline' }}>★ Save as routine</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={loadRoutine} activeOpacity={0.8}>
                    <Text style={{ color:'#fff', textDecorationLine:'underline' }}>↺ Load routine</Text>
                  </TouchableOpacity>
                </View>

                {checked.length > 0 && (
                  <TouchableOpacity
                    onPress={logCompletedToday}
                    disabled={isLogging}
                    style={[styles.logBtn, isLogging && { opacity: 0.6 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.logBtnText}>{isLogging ? 'Saving…' : 'Log completed'}</Text>
                  </TouchableOpacity>
                )}
              </>
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

  // Inline editor
  editorCard: {
    backgroundColor: '#00000033',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  editorInputWrap: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editorInput: {
    color: '#333',
    fontSize: 14,
    paddingVertical: 6,
  },

  // Log button
  logBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logBtnText: { color: BG, fontWeight: '700' },

  // Bottom nav
  navBar: {
    position: 'absolute', bottom: 10, width, height: 90,
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: CARD_BG, alignItems: 'center',
  },
  navButton: { padding: 4 },
  navIcon: { width: 44, height: 44, tintColor: '#fff' },
  activeNavButton: { backgroundColor: '#fff', borderRadius: 28, padding: 9 },
});
