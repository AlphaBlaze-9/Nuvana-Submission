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
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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

const OPTIONS = ['Last 7 Days', 'Last Month', 'Last Year', 'Lifetime', 'Cancel'];
const CANCEL_INDEX = 4;

export default function ProgressPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const [dateRange, setDateRange] = useState('Lifetime');

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

  const showRangePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: OPTIONS, cancelButtonIndex: CANCEL_INDEX },
        (buttonIndex) => {
          if (buttonIndex < CANCEL_INDEX) {
            setDateRange(OPTIONS[buttonIndex]);
          }
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>My Progress</Text>

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
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={dateRange}
                onValueChange={setDateRange}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Last 7 Days" value="Last 7 Days" />
                <Picker.Item label="Last Month"   value="Last Month"   />
                <Picker.Item label="Last Year"    value="Last Year"    />
                <Picker.Item label="Lifetime"     value="Lifetime"     />
              </Picker>
            </View>
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
              <Image source={src} style={styles.navIcon} resizeMode="contain" />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const navIcons = [
  { key: 'Book',     src: BookIcon,     routeName: 'JournalPage' },
  { key: 'Check',    src: CheckIcon,    routeName: 'ProgressPage' },
  { key: 'Home',     src: HomeIcon,     routeName: 'HomePage' },
  { key: 'Calendar', src: CalendarIcon, routeName: 'CalendarPage' },
  { key: 'Text',     src: TextIcon,     routeName: 'AIPage' },
];

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
  dateRangeLabel: {
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
  },
  dateRangeValueContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateRangeValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  picker: {
    color: '#fff',
    height: 40,
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