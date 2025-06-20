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

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const BG = '#a8e6cf';

export default function HomePage() {
  const navigation = useNavigation();

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
    { key: 'Home',     src: HomeIcon,     onPress: () => {} },
    { key: 'Calendar', src: CalendarIcon, onPress: () => navigation.navigate('CalendarPage') },
    { key: 'Text',     src: TextIcon,     onPress: () => navigation.navigate('AIPage') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.logoutOverlay}
        onPress={() => navigation.replace('WelcomePage')}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.welcomeText}>Welcome, Samarth</Text>
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
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  scrollContent: {
    paddingTop: 60,
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
