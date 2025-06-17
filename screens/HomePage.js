import React, { useEffect, useState, useRef } from 'react';
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
import * as CalendarAPI from 'expo-calendar';
import { useNavigation } from '@react-navigation/native';

import NuvanaLogo   from '../assets/Nuvana.png';
import BookIcon     from '../assets/Book.png';
import CheckIcon    from '../assets/Check.png';
import HomeIcon     from '../assets/Home.png';
import CalendarIcon from '../assets/Calendar.png';
import TextIcon     from '../assets/Text.png';
import PhoneIcon    from '../assets/phone.png';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const BG = '#a8e6cf';

const ProgressBar = ({ progress }) => (
  <View style={styles.progressBackground}>
    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
  </View>
);

export default function HomePage() {
  const navigation = useNavigation();
  const [daysSober] = useState(0.6);
  const [habit]     = useState(0.4);
  const [mood]      = useState(0.7);

  const scaleAnim   = useRef(new Animated.Value(1)).current;
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

  useEffect(() => {
    (async () => {
      const { status } = await CalendarAPI.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        await CalendarAPI.getCalendarsAsync(CalendarAPI.EntityTypes.EVENT);
      }
    })();
  }, []);

  const navIcons = [
    { key: 'Book',     src: BookIcon,     onPress: () => navigation.navigate('JournalPage') },
    { key: 'Check',    src: CheckIcon,    onPress: () => navigation.navigate('ProgressPage') },
    { key: 'Home',     src: HomeIcon,     onPress: () => {/* TODO */} },
    { key: 'Calendar', src: CalendarIcon, onPress: () => navigation.navigate('CalendarPage') },
    { key: 'Text',     src: TextIcon,     onPress: () => navigation.navigate('AIPage') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Visible logout button */}
      <TouchableOpacity
        style={styles.logoutOverlay}
        onPress={() => navigation.replace('WelcomePage')}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.welcomeText}>Welcome, Samarth</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress Tracker</Text>
          <View style={styles.bars}>
            <Text style={styles.barLabel}>Days Sober</Text>
            <ProgressBar progress={daysSober} />
            <Text style={styles.barLabel}>Habit Tracker</Text>
            <ProgressBar progress={habit} />
            <Text style={styles.barLabel}>Mood Rating</Text>
            <ProgressBar progress={mood} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Today's Focus List</Text>
            <Text style={styles.infoText}>Integration Journal</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Quote Of The Day</Text>
            <Text style={styles.tipText}>"Keep going—every sober day counts!"</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Support Hotline</Text>
            <Image source={PhoneIcon} style={styles.hotlineIcon} resizeMode="contain" />
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Nova To-Do</Text>
            <Text style={styles.infoText}>• Feed Nova</Text>
            <Text style={styles.infoText}>• Dress Nova</Text>
            <Text style={styles.infoText}>• Talk to Nova</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.navBar}>
        {navIcons.map(({ key, src, onPress }) => {
          const isActive = key === 'Home';
          if (isActive) {
            return (
              <Animated.View
                key={key}
                style={[
                  styles.navButton,
                  styles.activeNavButton,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  },
                ]}
              >
                <TouchableOpacity onPress={onPress}>
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
              onPress={onPress}
              style={styles.navButton}
            >
              <Image
                source={src}
                style={styles.navIcon}
                resizeMode="contain"
              />
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
    backgroundColor: BG,
  },
  logoutOverlay: {
    position: 'absolute',
    top: 70,
    left: 16,
    zIndex: 10,
    backgroundColor: '#d3c6f1',
    paddingVertical: 10,    // ↑ doubled
    paddingHorizontal: 5,  // ↑ increased
    borderRadius: 8,
    minWidth: 100,          // ensure a minimum tap area
    alignItems: 'center',   // center the text
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,           // ↑ larger text
  },
  
  scrollContent: {
    paddingTop: 60,      // leave room for logout
    paddingBottom: 100,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginVertical: 5,
    marginTop: -75,
  },
  welcomeText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  card: {
    width: width * 0.9,
    backgroundColor: '#d3c6f1',
    borderRadius: 20,
    padding: CARD_PADDING,
    marginTop: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff',
    textAlign: 'center',
  },
  bars: {
    width: '100%',
  },
  barLabel: {
    fontSize: 14,
    marginTop: 8,
    color: '#fff',
  },
  progressBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width,
    marginTop: 20,
  },
  infoBox: {
    backgroundColor: '#d3c6f1',
    width: width * 0.45,
    minHeight: 120,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
  },
  hotlineIcon: {
    width: 48,
    height: 48,
    tintColor: '#fff',
    marginTop: 8,
  },
  navBar: {
    position: 'absolute',
    bottom: 10,
    width,
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#d3c6f1',
    alignItems: 'center',
  },
  navButton: {
    padding: 4,
  },
  navIcon: {
    width: 44,
    height: 44,
    tintColor: '#fff',
  },
  activeNavButton: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 6,
  },
  activeNavIcon: {
    tintColor: BG,
  },
});
