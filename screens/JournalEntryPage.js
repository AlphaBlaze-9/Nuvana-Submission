import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';
const PADDING = 16;

export default function JournalEntryPage() {
  const navigation = useNavigation();
  const route = useRoute();

  const entry = route.params?.entry || { id: '', title: '', subtitle: '' };
  const [title, setTitle] = useState(entry.title);
  const [subtitle, setSubtitle] = useState(entry.subtitle);

  function handleSave() {
    navigation.navigate('JournalPage', { updatedEntry: { id: entry.id, title, subtitle } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inlineHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput
            style={styles.inputTitle}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
          <TextInput
            style={styles.inputSubtitle}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="Details..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            multiline
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingVertical: 10,
    backgroundColor: BG,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  headerButtonText: {
    color: BG,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: PADDING,
    paddingTop: 20,
  },
  inputTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',               
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: PADDING,
    marginBottom: PADDING,
    width: width - PADDING * 2,
    alignSelf: 'center',
  },
  inputSubtitle: {
    fontSize: 16,
    color: '#fff',  
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: PADDING,
    width: width - PADDING * 2,
    minHeight: 150,
    alignSelf: 'center',
    textAlignVertical: 'top',
  },
});
