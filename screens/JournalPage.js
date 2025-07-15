import React, { useRef, useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

import NuvanaLogo   from '../assets/Nuvana.png';
import BookIcon     from '../assets/Book.png';
import CheckIcon    from '../assets/Check.png';
import HomeIcon     from '../assets/Home.png';
import CalendarIcon from '../assets/Calendar.png';
import TextIcon     from '../assets/Text.png';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';

const CARD_MARGIN = 8;
const NUM_COLS = 2;
const CARD_SIZE = (width - CARD_MARGIN * (NUM_COLS + 1)) / NUM_COLS;

const navIcons = [
  { key: 'Book',     src: BookIcon,     routeName: 'JournalPage' },
  { key: 'Check',    src: CheckIcon,    routeName: 'ProgressPage' },
  { key: 'Home',     src: HomeIcon,     routeName: 'HomePage' },
  { key: 'Calendar', src: CalendarIcon, routeName: 'CalendarPage' },
  { key: 'Text',     src: TextIcon,     routeName: 'AIPage' },
];

const INITIAL_ENTRIES = [
  { id: '1', title: "Samarth's Relief", subtitle: 'Here’s a quick snapshot…' },
];

export default function JournalPage() {
  const navigation = useNavigation();
  const route = useRoute();

  const [entries, setEntries] = useState(INITIAL_ENTRIES);

  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
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

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const updated = await Promise.all(
          entries.map(async e => {
            const stored = await AsyncStorage.getItem(`lastOpened:${e.id}`);
            return {
              ...e,
              lastOpened: stored ?? 'Never opened',
            };
          })
        );
        setEntries(updated);
      })();
    }, [])
  );

  const openEntry = async entry => {
    const now = new Date().toLocaleString();
    await AsyncStorage.setItem(`lastOpened:${entry.id}`, now);
    navigation.navigate('JournalEntryPage', { entry });
  };

  const data = [{ type: 'add', id: 'add' }, ...entries.map(e => ({ ...e, type: 'entry' }))];

  function renderTile({ item }) {
    if (item.type === 'add') {
      return (
        <TouchableOpacity
          style={[styles.card, styles.addCard]}
          onPress={() => navigation.navigate('JournalEntryPage')}
          activeOpacity={0.7}
        >
          <Text style={styles.plus}>+</Text>
          <Text style={styles.addText}>New Entry</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openEntry(item)}
      >
        <View>
          <Text style={styles.entryTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.entrySubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>
        <Text style={styles.entryDate}>{item.lastOpened}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={NuvanaLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>My Journal</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={i => i.id}
        numColumns={NUM_COLS}
        renderItem={renderTile}
        contentContainerStyle={styles.gridList}
        columnWrapperStyle={styles.row} 
      />

      <View style={styles.navBar}>
        {navIcons.map(({ key, src, routeName }) => {
          const isActive = route.name === routeName;
          const wrapperStyle = isActive
            ? [styles.navButton, styles.activeNavButton, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]
            : styles.navButton;
          const iconStyle = isActive
            ? [styles.navIcon, styles.activeNavIcon]
            : styles.navIcon;

          return (
            <Animated.View key={key} style={wrapperStyle}>
              <TouchableOpacity onPress={() => navigation.navigate(routeName)}>
                <Image source={src} style={iconStyle} />
              </TouchableOpacity>
            </Animated.View>
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
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
  },

  gridList: {
    padding: CARD_MARGIN,
    paddingBottom: 110,
  },
  row: {
    justifyContent: 'center',
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.3,
    margin: CARD_MARGIN,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: CARD_MARGIN,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  addCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    fontSize: 48,
    color: '#888',
    lineHeight: 48,
  },
  addText: {
    marginTop: 4,
    fontSize: 16,
    color: '#888',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  entrySubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  entryDate: {
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
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
  activeNavButton: { backgroundColor: '#fff', borderRadius: 28, padding: 9 },
  activeNavIcon: {
    tintColor: BG,
  },
});
