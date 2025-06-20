import 'react-native-url-polyfill/auto';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomePage from './screens/WelcomePage';
import SignUpPage from './screens/SignUpPage';
import LoginPage from './screens/LoginPage';
import HomePage from './screens/HomePage';
import CalendarPage from './screens/CalendarPage';
import ProgressPage from './screens/ProgressPage';
import JournalPage from './screens/JournalPage';
import JournalEntryPage from './screens/JournalEntryPage';
import AIPage from './screens/AIPage';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="WelcomePage" component={WelcomePage} />
        <Stack.Screen name="SignUpPage" component={SignUpPage} />
        <Stack.Screen name="LoginPage" component={LoginPage} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="CalendarPage" component={CalendarPage} />
        <Stack.Screen name="ProgressPage" component={ProgressPage} />
        <Stack.Screen name="JournalPage" component={JournalPage} />
        <Stack.Screen name="JournalEntryPage" component={JournalEntryPage} />
        <Stack.Screen name="AIPage" component={AIPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}