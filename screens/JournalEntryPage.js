import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const BG = '#a8e6cf';
const CARD_BG = '#d3c6f1';
const PADDING = 16;

// your deployed Apps Script URL
const SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbz7ZbDnf66SGTAbcbrv5iTxNRXcopS9g7w20eyoM5817IKNqeXL8yPv1HYohfI6JiHo/exec';

export default function JournalEntryPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const entry = route.params?.entry || {};

  // Always show metrics modal, even on reopen
  const [modalVisible, setModalVisible] = useState(true);
  // Loading indicator
  const [loading, setLoading] = useState(false);

  // Metrics state
  const [mood, setMood] = useState(entry.mood ? Number(entry.mood) : 1);
  const [craving, setCraving] = useState(entry.craving ? Number(entry.craving) : 1);
  const [sentiment, setSentiment] = useState(
    entry.sentiment !== undefined ? Number(entry.sentiment) : 0
  );
  const [sleep, setSleep] = useState(entry.sleep ? Number(entry.sleep) : 0);
  const [stress, setStress] = useState(entry.stress ? Number(entry.stress) : 1);

  // Text state
  const [title, setTitle] = useState(entry.title || '');
  const [subtitle, setSubtitle] = useState(entry.subtitle || '');

  useEffect(() => {
    setMood(entry.mood ?? mood);
    setCraving(entry.craving ?? craving);
    setSentiment(entry.sentiment ?? sentiment);
    setSleep(entry.sleep ?? sleep);
    setStress(entry.stress ?? stress);
  }, [entry]);

  const Stepper = ({ label, value, setValue, min, max, step = 1, decimal }) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.stepButton}
        onPress={() => {
          const v = Math.max(value - step, min);
          setValue(decimal ? parseFloat(v.toFixed(1)) : v);
        }}
      >
        <Text style={styles.stepText}>–</Text>
      </TouchableOpacity>
      <Text style={styles.metricValue}>{decimal ? value.toFixed(1) : value}</Text>
      <TouchableOpacity
        style={styles.stepButton}
        onPress={() => {
          const v = Math.min(value + step, max);
          setValue(decimal ? parseFloat(v.toFixed(1)) : v);
        }}
      >
        <Text style={styles.stepText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const handleNext = () => setModalVisible(false);

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      id: entry.id,
      title,
      subtitle,
      mood,
      craving,
      sentiment,
      sleep,
      stress,
    };
    try {
      await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to save entry:', err);
    }
    setLoading(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await fetch(SHEET_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: entry.id, delete: true }),
              });
            } catch (err) {
              console.error('Failed to delete entry:', err);
            }
            setLoading(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quick Check‑In</Text>
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

            <TouchableOpacity onPress={handleNext} style={styles.continueButton}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {!modalVisible && (
        <>
          <View style={styles.inlineHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>{'< Back'}</Text>
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
                placeholder="Details…"
                placeholderTextColor="rgba(255,255,255,0.7)"
                multiline
              />
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete Entry</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: BG },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContainer: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    backgroundColor:'rgba(0,0,0,0.5)',
  },
  modalContent:   {
    width:         width - PADDING * 2,
    backgroundColor:'#fff',
    borderRadius:  12,
    padding:       PADDING,
    alignItems:    'center',
  },
  modalTitle:     { fontSize: 20, fontWeight: '600', marginBottom: PADDING },
  metricRow:      {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   12,
    width:          '100%',
    justifyContent: 'space-between',
  },
  metricLabel:    { fontSize: 16, flex: 1 },
  stepButton:     {
    width:         32,
    height:        32,
    borderRadius:  16,
    backgroundColor:CARD_BG,
    justifyContent:'center',
    alignItems:    'center',
  },
  stepText:       { fontSize: 18, fontWeight: '600' },
  metricValue:    { width: 40, textAlign: 'center', fontSize: 16 },
  continueButton: {
    marginTop:      8,
    backgroundColor:CARD_BG,
    paddingVertical:12,
    paddingHorizontal:24,
    borderRadius:   8,
  },
  continueText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  inlineHeader:   {
    flexDirection: 'row',
    justifyContent:'space-between',
    paddingHorizontal:PADDING,
    paddingVertical: 10,
    backgroundColor: BG,
  },
  headerButton:   {
    paddingHorizontal:8,
    paddingVertical:  4,
    backgroundColor: '#fff',
    borderRadius:    6,
  },
  headerButtonText:{ color: BG, fontSize: 16, fontWeight: '600' },
  content:        { padding: PADDING, paddingTop: 20 },
  inputTitle:     {
    fontSize:      20,
    fontWeight:    '600',
    color:         '#fff',
    backgroundColor:CARD_BG,
    borderRadius:  12,
    padding:       PADDING,
    marginBottom:  PADDING,
    width:         width - PADDING * 2,
    alignSelf:     'center',
  },
  inputSubtitle:  {
    fontSize:      16,
    color:         '#fff',
    backgroundColor:CARD_BG,
    borderRadius:  12,
    padding:       PADDING,
    width:         width - PADDING * 2,
    minHeight:     150,
    alignSelf:     'center',
    textAlignVertical:'top',
  },
  deleteButton:   {
    marginTop:      20,
    backgroundColor:'#FF6961',
    paddingVertical:12,
    paddingHorizontal:24,
    borderRadius:   8,
    alignSelf:      'center',
  },
  deleteText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
});