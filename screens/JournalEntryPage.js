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
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';
const PADDING = 16;

export default function JournalEntryPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const entry = route.params?.entry || {};

  const [mood, setMood] = useState(entry.mood ? Number(entry.mood) : 1);
  const [craving, setCraving] = useState(entry.craving ? Number(entry.craving) : 1);
  const [sentiment, setSentiment] = useState(
    entry.sentiment !== undefined ? Number(entry.sentiment) : 0
  );
  const [sleep, setSleep] = useState(entry.sleep ? Number(entry.sleep) : 0);
  const [stress, setStress] = useState(entry.stress ? Number(entry.stress) : 1);

  const [title, setTitle] = useState(entry.title || '');
  const [subtitle, setSubtitle] = useState(entry.subtitle || '');

  const [modalVisible, setModalVisible] = useState(true);

  const handleNext = () => setModalVisible(false);

  const handleSave = () => {
    const metricsHeader =
      `Mood: ${mood}\n` +
      `Craving Level: ${craving}\n` +
      `Sentiment Score: ${sentiment.toFixed(1)}\n` +
      `Sleep Hours: ${sleep}\n` +
      `Stress Rating: ${stress}\n\n`;

    navigation.navigate('JournalPage', {
      updatedEntry: {
        id: entry.id,
        title,
        subtitle: metricsHeader + subtitle,
      },
    });
  };

  const Stepper = ({ label, value, setValue, min, max, step = 1, decimal }) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.stepButton}
        onPress={() => {
          const newVal = value - step;
          const clipped = newVal < min ? min : newVal;
          setValue(decimal ? parseFloat(clipped.toFixed(1)) : clipped);
        }}
      >
        <Text style={styles.stepText}>–</Text>
      </TouchableOpacity>
      <Text style={styles.metricValue}>
        {decimal ? value.toFixed(1) : value}
      </Text>
      <TouchableOpacity
        style={styles.stepButton}
        onPress={() => {
          const newVal = value + step;
          const clipped = newVal > max ? max : newVal;
          setValue(decimal ? parseFloat(clipped.toFixed(1)) : clipped);
        }}
      >
        <Text style={styles.stepText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quick Check-In</Text>
            <Stepper label="Mood" value={mood} setValue={setMood} min={1} max={10} />
            <Stepper label="Craving" value={craving} setValue={setCraving} min={1} max={10} />
            <Stepper
              label="Sentiment"
              value={sentiment}
              setValue={setSentiment}
              min={-1}
              max={1}
              step={0.1}
              decimal
            />
            <Stepper label="Sleep" value={sleep} setValue={setSleep} min={0} max={24} />
            <Stepper label="Stress" value={stress} setValue={setStress} min={1} max={10} />
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {!modalVisible && (
        <>
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
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width - PADDING * 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: PADDING,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: PADDING,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  metricLabel: { fontSize: 16, flex: 1 },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: { fontSize: 18, fontWeight: '600' },
  metricValue: { width: 40, textAlign: 'center', fontSize: 16 },
  nextButton: {
    marginTop: 8,
    backgroundColor: BG,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  headerButtonText: { color: BG, fontSize: 16, fontWeight: '600' },
  content: { padding: PADDING, paddingTop: 20 },
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