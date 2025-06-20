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
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';

import NuvanaLogo from '../assets/Nuvana.png';
import BookIcon from '../assets/Book.png';
import CheckIcon from '../assets/Check.png';
import HomeIcon from '../assets/Home.png';
import CalendarIcon from '../assets/Calendar.png';
import TextIcon from '../assets/Text.png';
import PhoneIcon from '../assets/phone.png';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';

function parseDateToYMD(dateString) {
  if (dateString.includes('/')) {
    const [m, d, y] = dateString.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateString;
}

export default function CalendarPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedDate, setSelectedDate] = useState('');
  const [eventDetails] = useState([
    { eventName: 'Yoga Workshop', eventDate: '2025-06-20' },
    { eventName: 'Meditation Retreat', eventDate: '2025-06-25' },
  ]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const today = new Date().toISOString().split('T')[0];

  const markedDates = {};
  eventDetails.forEach(evt => {
    const d = parseDateToYMD(evt.eventDate);
    markedDates[d] = {
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: BG,
          backgroundColor: CARD_BG,
        },
        text: { color: '#fff' },
      },
    };
  });
  if (today) {
    markedDates[today] = {
      ...(markedDates[today] || {}),
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: '#fff',
          backgroundColor: CARD_BG,
        },
        text: { color: BG, fontWeight: 'bold' },
      },
    };
  }
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      customStyles: {
        container: {
          backgroundColor: '#fff',
        },
        text: { color: BG },
      },
    };
  }

  const onDayPress = day => setSelectedDate(day.dateString);

  const navIcons = [
    { key: 'Book', src: BookIcon, routeName: 'JournalPage' },
    { key: 'Check', src: CheckIcon, routeName: 'ProgressPage' },
    { key: 'Home', src: HomeIcon, routeName: 'HomePage' },
    { key: 'Calendar', src: CalendarIcon, routeName: 'CalendarPage' },
    { key: 'Text', src: TextIcon, routeName: 'AIPage' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>My Calendar</Text>

        <View style={styles.card}>
          <Calendar
            style={styles.calendar}
            markingType="custom"
            theme={{
              backgroundColor: CARD_BG,
              calendarBackground: CARD_BG,
              monthTextColor: '#fff',
              dayTextColor: '#fff',
              arrowColor: '#fff',
              textSectionTitleColor: '#fff',
            }}
            markedDates={markedDates}
            onDayPress={onDayPress}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.upcomingTitle}>Upcoming Events</Text>
          {eventDetails.length > 0 ? (
            eventDetails.map((evt, i) => (
              <Text key={i} style={styles.upcomingText}>
                • {evt.eventName} — {parseDateToYMD(evt.eventDate)}
              </Text>
            ))
          ) : (
            <Text style={styles.upcomingText}>No Events Currently</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.navBar}>
        {navIcons.map(({ key, src, routeName }) => {
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
                  <Image
                    source={src}
                    style={[styles.navIcon, styles.activeNavIcon]}
                    resizeMode="contain"
                  />
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
              <Image source={src} style={styles.navIcon} resizeMode="contain" />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 100, alignItems: 'center' },
  logo: { width: 150, height: 150, marginTop: 0, marginBottom: 5 },
  title: { fontSize: 40, fontWeight: '700', color: '#fff' },
  card: {
    width: width * 0.9,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: CARD_PADDING,
    marginTop: 20,
  },
  calendar: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  upcomingText: { fontSize: 16, color: '#fff', marginBottom: 6 },
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
  activeNavButton: { backgroundColor: '#fff', borderRadius: 28, padding: 6 },
  activeNavIcon: { tintColor: BG },
});