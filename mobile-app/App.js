import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import PresentationsScreen from './src/screens/PresentationsScreen';
import UploadScreen from './src/screens/UploadScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import VaultScreen from './src/screens/VaultScreen';
import SlideViewerScreen from './src/screens/SlideViewerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { isInstructor, signOut, user } = useAuth();
  const confirmLogout = () =>
    Alert.alert('Log out', `Signed in as ${user?.name || ''}. Log out?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut }
    ]);
  return (
    <Tab.Navigator
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={confirmLogout} style={{ paddingHorizontal: 14 }}>
            <Text style={{ color: '#d4af37', fontWeight: '800', fontSize: 12 }}>Log out</Text>
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: '#050505',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#1c1917'
        },
        headerTintColor: '#fef08a', // Pale gold
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 17,
          letterSpacing: 0.5
        },
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#262626',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarActiveTintColor: '#d4af37', // Metallic gold
        tabBarInactiveTintColor: '#737373',
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 10
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'SlideBox',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="Slides"
        component={PresentationsScreen}
        options={{
          title: 'Slide Vault',
          tabBarLabel: 'Slides',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text>
        }}
      />
      {isInstructor && (
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          title: 'Upload Content',
          tabBarLabel: 'Upload',
          tabBarIcon: () => (
            <View style={styles.uploadTabIcon}>
              <Text style={{ color: '#000', fontSize: 20, fontWeight: '900' }}>+</Text>
            </View>
          )
        }}
      />
      )}
      <Tab.Screen
        name="Exercises"
        component={ExercisesScreen}
        options={{
          title: 'Exercise Hub',
          tabBarLabel: 'Exercises',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📝</Text>
        }}
      />
      <Tab.Screen
        name="Vault"
        component={VaultScreen}
        options={{
          title: 'Vault Metrics',
          tabBarLabel: 'Vault',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👑</Text>
        }}
      />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, ready, isInstructor } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }
  if (!user) return <LoginScreen />;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        {isInstructor && (
          <Stack.Screen
            name="Subjects"
            component={SubjectsScreen}
            options={{
              headerShown: true,
              title: 'Manage Subjects',
              headerStyle: { backgroundColor: '#050505' },
              headerTintColor: '#d4af37'
            }}
          />
        )}
        <Stack.Screen
          name="SlideViewer"
          component={SlideViewerScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  uploadTabIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8
  }
});
