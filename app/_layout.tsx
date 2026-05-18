// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="job-detail"
                options={{
                  headerShown: true,
                  headerTitle: 'تفاصيل الوظيفة',
                  headerStyle: { backgroundColor: '#080d1a' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { color: '#ffffff' },
                }}
              />
              <Stack.Screen
                name="ai-chat"
                options={{
                  headerShown: true,
                  headerTitle: 'وكيل الذكاء الاصطناعي',
                  headerStyle: { backgroundColor: '#080d1a' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { color: '#ffffff' },
                }}
              />
              <Stack.Screen
                name="interview"
                options={{
                  headerShown: true,
                  headerTitle: 'محاكاة مقابلة صوتية',
                  headerStyle: { backgroundColor: '#080d1a' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { color: '#ffffff' },
                }}
              />
              <Stack.Screen
                name="cv-manager"
                options={{
                  headerShown: true,
                  headerTitle: 'مدير السير الذاتية',
                  headerStyle: { backgroundColor: '#080d1a' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { color: '#ffffff' },
                }}
              />
              <Stack.Screen
                name="alerts"
                options={{
                  headerShown: true,
                  headerTitle: 'تنبيهات الوظائف',
                  headerStyle: { backgroundColor: '#080d1a' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { color: '#ffffff' },
                }}
              />
              <Stack.Screen
                name="subscription"
                options={{
                  headerShown: true,
                  headerTitle: 'الاشتراك Premium',
                  headerStyle: { backgroundColor: '#080d1a' },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { color: '#ffffff' },
                }}
              />
            </Stack>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
