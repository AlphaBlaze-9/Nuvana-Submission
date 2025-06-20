import React, { useRef, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';

import NuvanaLogo   from '../assets/Nuvana.png';
import BookIcon     from '../assets/Book.png';
import CheckIcon    from '../assets/Check.png';
import HomeIcon     from '../assets/Home.png';
import CalendarIcon from '../assets/Calendar.png';
import TextIcon     from '../assets/Text.png';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';

const navIcons = [
  { key: 'Book',     src: BookIcon,     routeName: 'JournalPage' },
  { key: 'Check',    src: CheckIcon,    routeName: 'ProgressPage' },
  { key: 'Home',     src: HomeIcon,     routeName: 'HomePage' },
  { key: 'Calendar', src: CalendarIcon, routeName: 'CalendarPage' },
  { key: 'Text',     src: TextIcon,     routeName: 'AIPage' },
];

export default function AIPetPage() {
  const navigation = useNavigation();
  const route = useRoute();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>My AI Pet</Text>
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
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  },
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
  scrollContent: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginTop: 0,
    marginBottom: 5,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
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