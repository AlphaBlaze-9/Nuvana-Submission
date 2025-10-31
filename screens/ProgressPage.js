import React, { useRef, useEffect, useState } from 'react';
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
  ActionSheetIOS,
  Platform,
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

// ---- Apps Script endpoint (supports mode=events) ----
const SHEETS_READ_URL =
  'https://script.google.com/macros/s/AKfycbz0XpvknugZlGoelhg-n2QLkXwBThcKDChrINzjwE-m7M4gqkR043BsWr4Fv1pxW9XFkg/exec';

const OPTIONS = ['Last 7 Days', 'Last Month', 'Last Year', 'Lifetime', 'Cancel'];
const CANCEL_INDEX = 4;

export default function ProgressPage() {
  const navigation = useNavigation();
  const route      = useRoute();

  // Username from route or storage
  const [username, setUsername]    = useState(route.params?.username || '');
  const [usernameReady, setUReady] = useState(!!route.params?.username);

  // UI state
  const [dateRange, setDateRange] = useState('Lifetime');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Data + computed analytics
  const [events, setEvents]           = useState([]);
  const [score, setScore]             = useState(0);
  const [streak, setStreak]           = useState(0);
  const [topTriggers, setTopTriggers] = useState([]);
  const [bestCoping, setBestCoping]   = useState([]);
  const [forecast, setForecast]       = useState([]);
  const [insight, setInsight]         = useState(null);

  // Nav animation
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Load username if not provided
  useEffect(() => {
    if (username) { setUReady(true); return; }
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('username');
        if (stored) setUsername(stored);
      } finally {
        setUReady(true);
      }
    })();
  }, [username]);

  // Active tab animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim,   { toValue: 1.3, duration: 500, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // Fetch logs whenever username or dateRange changes
  useEffect(() => {
    if (!usernameReady) return;
    if (!username) {
      setError('No username found');
      setLoading(false);
      return;
    }
    let canceled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${SHEETS_READ_URL}?mode=events&username=${encodeURIComponent(username)}`;
        const res = await fetch(url);
        const txt = await res.text();

        let json;
        try { json = JSON.parse(txt); }
        catch { throw new Error('Sheets endpoint did not return JSON'); }

        if (!json?.ok) throw new Error(json?.error || 'Failed to load progress');

        // Events may already be in the right shape; run through coercer for safety.
        const rawRows = Array.isArray(json.events) ? json.events
                      : Array.isArray(json.rows)   ? json.rows
                      : [];
        const all = rawRows.map(coerceRowsToEvents).filter(Boolean);

        // Sort ascending, then filter by range
        const sorted = all.slice().sort((a,b)=> new Date(a.ts) - new Date(b.ts));
        const filtered = filterByRange(sorted, dateRange);
        if (canceled) return;

        // Compute analytics
        const s   = computeConsistencyScore(filtered);
        const trg = computeTopTriggers(filtered);
        const cop = computeBestCoping(filtered);
        const fc  = simpleForecast(filtered);
        const ins = buildInsight(filtered, s, trg, cop);

        // Push state
        setEvents(filtered);
        setScore(s.score);
        setStreak(s.streak);
        setTopTriggers(trg.slice(0, 3));
        setBestCoping(cop.slice(0, 3));
        setForecast(fc);
        setInsight(ins);
      } catch (err) {
        if (!canceled) setError(err.message || 'Failed to load progress');
      } finally {
        if (!canceled) setLoading(false);
      }
    })();

    return () => { canceled = true; };
  }, [usernameReady, username, dateRange]);

  const showRangePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: OPTIONS, cancelButtonIndex: CANCEL_INDEX },
        (i) => i < CANCEL_INDEX && setDateRange(OPTIONS[i])
      );
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
      {/* Safety quick-actions */}
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
        <Text style={styles.title}>My Progress</Text>

        {/* Date range selector */}
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>Date Range:</Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={styles.dateRangeValueContainer}
              activeOpacity={0.7}
              onPress={showRangePicker}
            >
              <Text style={styles.dateRangeValue}>{dateRange} ▼</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.dateRangeValueContainer}>
              <Text style={styles.dateRangeValue}>{dateRange}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        {loading && (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {!loading && error && (
          <Card>
            <Text style={styles.cardTitle}>We hit a snag</Text>
            <Text style={styles.placeholder}>{error}</Text>
          </Card>
        )}

        {!loading && !error && (
          <>
            <Card>
              <Text style={styles.cardTitle}>Consistency</Text>
              <View style={styles.rowBetween}>
                <LargeNumber value={Math.round(score)} label="Score" />
                <LargeNumber value={streak} label="Day Streak" />
              </View>
              <Text style={styles.cardNote}>
                Score uses a forgiving EWMA streak—slips lower the score a little, but wins build fast.
              </Text>
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Top Triggers</Text>
              {topTriggers.length === 0 ? (
                <Text style={styles.placeholder}>No clear triggers yet. Keep logging for a few more days.</Text>
              ) : (
                topTriggers.map((t) => (
                  <ChipRow
                    key={t.name}
                    left={t.name}
                    right={`${t.lift.toFixed(2)}× risk`}
                    sub={`CI ${t.ciLow.toFixed(2)}–${t.ciHigh.toFixed(2)} • n=${t.n}`}
                  />
                ))
              )}
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Most Helpful Skills</Text>
              {bestCoping.length === 0 ? (
                <Text style={styles.placeholder}>Log which coping skills you try to unlock this.</Text>
              ) : (
                bestCoping.map((c) => (
                  <ChipRow
                    key={c.name}
                    left={c.name}
                    right={`${c.delta < 0 ? '↓' : '↑'} ${Math.abs(c.delta).toFixed(2)} craving`}
                    sub="Matched within similar time contexts"
                  />
                ))
              )}
            </Card>

            <Card>
              <Text style={styles.cardTitle}>7-Day Craving Forecast</Text>
              {forecast.length === 0 ? (
                <Text style={styles.placeholder}>I’ll start forecasting once there’s enough data.</Text>
              ) : (
                <ForecastBar values={forecast} />
              )}
              {insight ? <Text style={styles.insight}>{insight}</Text> : null}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
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
                style={[styles.navButton, styles.activeNavButton, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
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

/* =========================
 * Presentational bits
 * ========================= */
function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}
function LargeNumber({ value, label }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.bigNumber}>{value}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}
function ChipRow({ left, right, sub }) {
  return (
    <View style={styles.rowBetween}>
      <View style={styles.chipLeft}><Text style={styles.chipLeftText}>{left}</Text></View>
      <View style={styles.chipRight}>
        <Text style={styles.chipRightText}>{right}</Text>
        {sub ? <Text style={styles.chipSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}
function ForecastBar({ values }) {
  const max = Math.max(...values, 0.01);
  return (
    <View style={styles.forecastRow}>
      {values.map((v, i) => (
        <View key={i} style={styles.forecastCol}>
          <View style={[styles.forecastBar, { height: 80 * (v / max) }]} />
          <Text style={styles.forecastLabel}>{['M','T','W','T','F','S','S'][i]}</Text>
        </View>
      ))}
    </View>
  );
}

/* =========================
 * Analytics helpers
 * ========================= */

function pad2(n){ return n < 10 ? `0${n}` : `${n}`; }
function toYMD(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

/** Convert arbitrary row shapes into our event object */
function coerceRowsToEvents(row) {
  if (!row) return null;
  const toArr = (v) => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') {
      return v.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    }
    if (v == null) return [];
    return [String(v)];
  };

  const ts = row.ts ?? row.timestamp ?? row.date ?? row.Time ?? row.TS;
  const d  = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;

  return {
    ts: d.toISOString(),
    mood: num(row.mood ?? row.Mood),
    craving_intensity: num(row.craving_intensity ?? row.craving ?? row.Craving),
    sleep_hours: num(row.sleep_hours ?? row.sleep ?? row.Sleep),
    stress: num(row.stress ?? row.Stress),
    activity: toArr(row.activity ?? row.activities ?? row.Activity),
    location_type: str(row.location_type ?? row.location ?? row.Location),
    coping_used: toArr(row.coping_used ?? row.coping ?? row.Coping),
    success: bool(row.success ?? row.Success),
  };
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : undefined; }
function str(v) { return (v == null) ? undefined : String(v); }
function bool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return /^(true|yes|y|1)$/i.test(v.trim());
  return !!v;
}

/** Filter events by label */
function filterByRange(all, label) {
  if (!Array.isArray(all) || all.length === 0) return [];
  const now = new Date();
  let start = new Date(0);
  if (label === 'Last 7 Days') {
    start = new Date(now); start.setDate(now.getDate() - 7);
  } else if (label === 'Last Month') {
    start = new Date(now); start.setMonth(now.getMonth() - 1);
  } else if (label === 'Last Year') {
    start = new Date(now); start.setFullYear(now.getFullYear() - 1);
  }
  return all.filter(e => {
    const t = new Date(e.ts);
    return t >= start && t <= now;
  });
}

/** Consistency Score with forgiving EWMA streak */
function computeConsistencyScore(events) {
  if (!events.length) return { score: 0, streak: 0 };
  const dayMap = new Map();
  events.forEach((e) => {
    const d = new Date(e.ts);
    const key = toYMD(d); // fixed: zero-padded Y-M-D to avoid Date parsing quirks
    const hit = e.success || (typeof e.craving_intensity === 'number' ? e.craving_intensity <= 5 : false);
    const prev = dayMap.get(key);
    dayMap.set(key, (prev ?? true) && hit);
  });
  const days = [...dayMap.entries()].sort((a,b)=> new Date(a[0])-new Date(b[0]));

  let score = 0;
  const gamma = 0.97; // decay/day
  let age = 0;
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const met = days[i][1];
    const reward = met ? 1 : -0.4;
    score += reward * Math.pow(gamma, age++);
    if (met) currentStreak += 1; else break;
  }
  const normalized = Math.max(0, Math.min(100, Math.round(100 * (1 - Math.exp(-Math.max(0, score))))));
  return { score: normalized, streak: currentStreak };
}

/** Risk lift + Wilson CI across categorical/context features */
function computeTopTriggers(events) {
  if (!events.length) return [];
  const isCrave = (e) => (e.craving_intensity ?? 0) >= 6;

  const feats = new Set();
  events.forEach((e) => {
    if (e.location_type) feats.add(e.location_type);
    if (Array.isArray(e.activity)) e.activity.forEach(a => feats.add(a));
    const d = new Date(e.ts);
    feats.add(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]);
    feats.add(`${d.getHours()}h`);
  });

  const pAll = mean(events.map(e => isCrave(e) ? 1 : 0)) || 0;
  const out = [];

  feats.forEach((name) => {
    const subset = events.filter((e) => {
      const d = new Date(e.ts);
      return e.location_type === name ||
             (Array.isArray(e.activity) && e.activity.includes(name)) ||
             ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] === name ||
             `${d.getHours()}h` === name;
    });
    if (subset.length < 6) return;
    const pHat = mean(subset.map(e => isCrave(e) ? 1 : 0));
    const { low, high } = wilson(pHat, subset.length, 1.96);
    const lift = pAll > 0 ? pHat / pAll : 0;
    if (pAll > 0 && (high < 0.9*pAll || low > 1.1*pAll)) {
      out.push({ name, lift, ciLow: low/(pAll||1), ciHigh: high/(pAll||1), n: subset.length });
    }
  });

  return out.sort((a,b)=> b.lift - a.lift);
}

/** Coping effectiveness via matched time-context difference */
function computeBestCoping(events) {
  if (!events.length) return [];
  const ctxKey = (d) => `${d.getDay()}-${d.getHours()}`;
  const buckets = new Map();
  events.forEach(e => {
    const k = ctxKey(new Date(e.ts));
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(e);
  });

  const skills = new Map(); // name -> diffs[]
  const allSkills = new Set();
  events.forEach(e => Array.isArray(e.coping_used) && e.coping_used.forEach(s => allSkills.add(s)));

  allSkills.forEach((s) => {
    const diffs = [];
    buckets.forEach((arr) => {
      const withS = arr.filter(e => Array.isArray(e.coping_used) && e.coping_used.includes(s));
      const withoutS = arr.filter(e => !Array.isArray(e.coping_used) || !e.coping_used.includes(s));
      if (withS.length >= 2 && withoutS.length >= 2) {
        const m1 = mean(withS.map(e => e.craving_intensity ?? 0));
        const m0 = mean(withoutS.map(e => e.craving_intensity ?? 0));
        diffs.push(m1 - m0); // negative = better
      }
    });
    if (diffs.length) skills.set(s, mean(diffs));
  });

  return [...skills.entries()]
    .map(([name, delta]) => ({ name, delta }))
    .sort((a,b) => a.delta - b.delta);
}

/** Simple 7-day forecast (EWMA baseline) */
function simpleForecast(events) {
  if (!events.length) return [];
  const xs = events
    .slice()
    .sort((a,b)=> new Date(a.ts)-new Date(b.ts))
    .map(e => (e.craving_intensity ?? 0));

  if (!xs.length) return [];

  const alpha = 0.3;
  let ew = xs[0];
  for (let i=1;i<xs.length;i++) ew = alpha*xs[i] + (1-alpha)*ew;

  const longMean = mean(xs);
  const decay = 0.85;
  const out = [];
  let cur = ew;
  for (let i=0;i<7;i++) {
    cur = decay*cur + (1-decay)*longMean;
    out.push(Math.min(1, Math.max(0, cur / 10)));
  }
  return out;
}

/** Insight sentence */
function buildInsight(events, s, triggers, coping) {
  if (!events.length) return null;
  const t = triggers[0];
  const c = coping[0];
  if (t && c) {
    return `New insight: ${c.name} reduced cravings by ${Math.abs(c.delta).toFixed(1)} on average in ${t.name} contexts.`;
  } else if (t) {
    return `You’re most vulnerable during “${t.name}” (${t.lift.toFixed(2)}×). Plan a skill beforehand.`;
  } else if (c) {
    return `Best skill lately: ${c.name} (avg change ${c.delta < 0 ? '↓' : '↑'}${Math.abs(c.delta).toFixed(1)}).`;
  }
  return `Consistency ${Math.round(s.score)} with a ${s.streak}-day streak—nice work.`;
}

/** Small stats helpers */
function mean(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function wilson(phat, n, z=1.96) {
  if (n === 0) return { low: 0, high: 0 };
  const denom = 1 + (z*z)/n;
  const center = (phat + (z*z)/(2*n)) / denom;
  const margin = (z*Math.sqrt((phat*(1-phat)/n) + (z*z)/(4*n*n))) / denom;
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

/* =========================
 * Styles
 * ========================= */
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

  scrollContent: { paddingBottom: 140, alignItems: 'center', paddingTop: 60 },
  logo: { width: 150, height: 150, marginTop: -60, marginBottom: 5 },
  title: { fontSize: 40, fontWeight: '700', color: '#fff', marginTop: 10 },

  dateRangeContainer: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
  },
  dateRangeLabel: { fontSize: 16, color: '#fff', marginRight: 8 },
  dateRangeValueContainer: { flex: 1, justifyContent: 'center' },
  dateRangeValue: { fontSize: 16, color: '#fff', fontWeight: '600' },

  card: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
  cardNote: { color: '#666', marginTop: 10, fontSize: 12 },
  placeholder: { color: '#999' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },

  bigNumber: { fontSize: 42, fontWeight: '800', color: BG },
  bigLabel: { fontSize: 13, color: '#666' },

  chipLeft: { backgroundColor: BG, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, marginRight: 8 },
  chipLeftText: { fontWeight: '700', color: '#0a6f59' },
  chipRight: { alignItems: 'flex-end', flex: 1 },
  chipRightText: { fontWeight: '700', color: '#333' },
  chipSub: { color: '#888', fontSize: 11 },

  forecastRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 },
  forecastCol: { alignItems: 'center', width: (width * 0.9 - 32) / 7 },
  forecastBar: { width: 16, backgroundColor: BG, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  forecastLabel: { marginTop: 4, fontSize: 11, color: '#666' },

  insight: { marginTop: 10, color: '#333', fontWeight: '600' },

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
