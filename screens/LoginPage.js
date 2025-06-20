import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://weonnniyegpesinyqmrx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlb25ubml5ZWdwZXNpbnlxbXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjYyMTEsImV4cCI6MjA2NTcwMjIxMX0.T7Ea5AACLr7aEt8PbijoAyLPR6UjFungv0l-TvO4z-Q';
const supabase = createClient(supabaseUrl, supabaseKey);

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.8;
const BG = '#a8e6cf';

export default function LoginPage({ navigation }) {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('rememberMe');
        if (saved === 'true') {
          const savedEmail = await AsyncStorage.getItem('email');
          const savedPassword = await AsyncStorage.getItem('password');
          if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
          }
        }
      } catch (err) {
        console.warn('Failed to load credentials', err);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Missing fields', 'Please enter both email and password.');
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Login Error', error.message);
      return;
    }

    try {
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
      } else {
        await AsyncStorage.multiRemove(['rememberMe', 'email', 'password']);
      }
    } catch (err) {
      console.warn('Failed to persist credentials', err);
    }

    navigation.replace('HomePage');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inlineHeader}>
        <TouchableOpacity
          onPress={() => navigation.replace('WelcomePage')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/Nuvana.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Log In</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.rememberContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
          />
          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Log In</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('SignUpPage')}
          style={styles.link}
        >
          <Text style={styles.linkText}>Don’t have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  inlineHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: -10,
  },
  logo: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  formContainer: {
    width: BUTTON_WIDTH,
    alignItems: 'center',
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 10,
    fontSize: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    justifyContent: 'center',
  },
  rememberText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 30,
    backgroundColor: '#d3c6f1',
    marginVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: '#333',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
