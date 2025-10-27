import { StyleSheet, StatusBar, Platform, BackHandler, Linking, View, Text, TouchableOpacity, ImageBackground } from 'react-native'
import React, { useEffect, useState } from 'react'
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';
import NetInfo from "@react-native-community/netinfo";
import VersionCheck from 'react-native-version-check';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { getMessaging, getToken, setBackgroundMessageHandler, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import Notification from './src/component/Notification';
import { TabProvider } from './src/Screen/TabContext';
import moment from 'moment';

// SplashScreen
import SplashScreen from './src/Screen/SplashScreen/Index'

// No Internet Page
import NoInternet from './src/Screen/NoInternet/Index'

// Promotion Modal
import PromotionGate from './src/component/PromotionGate';

// Auth
import IntroPage from './src/Screen/Auth/IntroPage';
import Login from './src/Screen/Auth/Login'
import OTP from './src/Screen/Auth/OTP'
import NewLogin from './src/Screen/Auth/NewLogin';
import ProfileSetup from './src/Screen/Auth/ProfileSetup'

// BTN_Layout
import BTN_Layout from './src/Screen/BTN_Layout'
import NewHome from './src/Screen/BTN_Tab/NewHome'
import Category from './src/Screen/BTN_Tab/Category'
import Subscribe from './src/Screen/BTN_Tab/Subscribe'
import NewProfile from './src/Screen/BTN_Tab/NewProfile'

// Pages
import SubscriptionCheckoutPage from './src/Screen/SubscriptionCheckoutPage/Index';
import CustomOrderScreen from './src/Screen/CustomOrderScreen/Index';
import SubscriptionOrderHistory from './src/Screen/SubscriptionOrderHistory/Index'
import CustomOrderHistory from './src/Screen/CustomOrderHistory/Index'
import CustomOrderDetailsPage from './src/Screen/CustomOrderDetailsPage/Index'
import SubscriptionOrderDetailsPage from './src/Screen/SubscriptionOrderDetailsPage/Index';
import MyOrder from './src/Screen/MyOrder/Index'
import Address from './src/Screen/Address/Index'
import Notificationpage from './src/Screen/Notificationpage/Index'
import HelpAndSupport from './src/Screen/HelpAndSupport/Index'
import AboutUs from './src/Screen/AboutUs/Index'
import TermsAndConditions from './src/Screen/TermsAndConditions/Index'
import PrivacyPolicy from './src/Screen/PrivacyPolicy/Index'
// import ReferCodeScreen from './src/Screen/ReferCodeScreen/Index'
import ReferralPage from './src/Screen/ReferralPage/Index'
import ProductCheckoutPage from './src/Screen/ProductCheckoutPage/Index'
import ProductHistory from './src/Screen/ProductHistory/Index'
import ProductDetailsPage from './src/Screen/ProductDetailsPage/Index'

const Stack = createStackNavigator();

// export const base_url = "https://panditapp.mandirparikrama.com/"
export const base_url = "https://pandit.33crores.com/"

const App = () => {

  const [showSplash, setShowSplash] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [hasSeenIntro, setHasSeenIntro] = useState<null | boolean>(null);
  const [showPromotion, setShowPromotion] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem('hasSeenIntro');
      setHasSeenIntro(v === 'true');
    })();
  }, []);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const currentVersion = await VersionCheck.getCurrentVersion();
        const storeVersion = await VersionCheck.getLatestVersion({
          provider: 'playStore',
        });

        console.log("storeVersion:", storeVersion);
        console.log("currentVersion:", currentVersion);

        const updateInfo = await VersionCheck.needUpdate({
          currentVersion,
          latestVersion: storeVersion,
        });

        if (updateInfo && updateInfo.isNeeded) {
          setLatestVersion(storeVersion);
          setShowUpdateModal(true);
          console.log("Update is required to version:", storeVersion);
        } else {
          console.log("No update needed or updateInfo is null");
        }
      } catch (error) {
        console.error('Error checking app version:', error);
      }
    };

    checkForUpdates();
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      if (showUpdateModal) {
        return true; // Prevent default behavior (closing the modal)
      }
      return false; // Allow default behavior
      // BackHandler.exitApp();
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [showUpdateModal]);

  // Get Access Token from AsyncStorage
  const getAccesstoken = async () => {
    var access_token = await AsyncStorage.getItem('storeAccesstoken');
    console.log("access_token=-=-", access_token);
    setAccessToken(access_token);
  }

  // Background Messsaging
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });

  // For Net Connection Info
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log("Connection type", state.type);
      console.log("Is connected?", state.isConnected);
      setIsConnected(state.isConnected ?? false);
    });
    return () => {
      unsubscribe();
      // setTimeout(unsubscribe, 5000);
    }
  }, []);

  // Splash Screen Show timer
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // CHANGED: Decide to show promo AFTER splash, ONLY when online and logged in
  useEffect(() => {
    const maybeShowPromo = async () => {
      if (showSplash) return;        // still showing splash
      if (!isConnected) return;      // no internet
      if (!accessToken) return;      // only for logged-in users

      // Always show promo
      setShowPromotion(true);
    };
    maybeShowPromo();
  }, [showSplash, isConnected, accessToken]); // CHANGED

  // Request Notification Permission
  const askNotificationPermissionOnce = async () => {
    const hasAsked = await AsyncStorage.getItem('notificationPermissionAsked');
    if (hasAsked) return;

    try {
      if (Platform.OS === 'android') {
        const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        if (result === RESULTS.GRANTED) {
          console.log('✅ Android notification permission granted');
          await getToken(getMessaging());
        } else {
          console.log('🚫 Android notification permission denied');
        }
      } else if (Platform.OS === 'ios') {
        const authStatus = await requestPermission(getMessaging());
        if (
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL
        ) {
          console.log('✅ iOS notification permission granted');
          await getToken(getMessaging());
        } else {
          console.log('🚫 iOS notification permission denied');
        }
      }

      await AsyncStorage.setItem('notificationPermissionAsked', 'true');
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  // ✅ On App Launch
  useEffect(() => {
    getAccesstoken();
    askNotificationPermissionOnce();
  }, []);

  return (
    <TabProvider>
      <NavigationContainer>
        {showPromotion && <PromotionGate baseUrl={base_url} onOpen={() => { }} onClose={() => { }} />}
        <Notification />
        <StatusBar backgroundColor="#334155" barStyle="light-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showSplash ? (<Stack.Screen name="SplashScreen" component={SplashScreen} options={{ presentation: 'modal', animationTypeForReplace: 'push', animation: 'slide_from_right' }} />) : null}
          {!isConnected ? (
            <Stack.Screen name="NoInternet" component={NoInternet} />
          ) : (
            <>
              {accessToken ?
                <Stack.Screen name="BTN_Layout" component={BTN_Layout} />
                :
                <>
                  {!hasSeenIntro ? <Stack.Screen name="IntroPage" component={IntroPage} /> : <Stack.Screen name="NewLogin" component={NewLogin} />}
                  {hasSeenIntro ? <Stack.Screen name="IntroPage" component={IntroPage} /> : <Stack.Screen name="NewLogin" component={NewLogin} />}
                </>
              }
              {!accessToken ? <Stack.Screen name="BTN_Layout" component={BTN_Layout} /> : <Stack.Screen name="NewLogin" component={NewLogin} />}
              {/* <Stack.Screen name='BTN_Layout' component={BTN_Layout} />
              {/* <Stack.Screen name="IntroPage" component={IntroPage} /> */}
              <Stack.Screen name='OTP' component={OTP} />
              <Stack.Screen name='ProfileSetup' component={ProfileSetup} />
              <Stack.Screen name='SubscriptionCheckoutPage' component={SubscriptionCheckoutPage} />
              <Stack.Screen name='CustomOrderScreen' component={CustomOrderScreen} />
              {/* <Stack.Screen name='NewHome' component={NewHome} /> */}
              <Stack.Screen name='Category' component={Category} />
              <Stack.Screen name='Subscribe' component={Subscribe} />
              <Stack.Screen name='NewProfile' component={NewProfile} />
              <Stack.Screen name='Notificationpage' component={Notificationpage} />
              <Stack.Screen name='MyOrder' component={MyOrder} />
              <Stack.Screen name='SubscriptionOrderHistory' component={SubscriptionOrderHistory} />
              <Stack.Screen name='SubscriptionOrderDetailsPage' component={SubscriptionOrderDetailsPage} />
              <Stack.Screen name='CustomOrderHistory' component={CustomOrderHistory} />
              <Stack.Screen name='CustomOrderDetailsPage' component={CustomOrderDetailsPage} />
              <Stack.Screen name='Address' component={Address} />
              <Stack.Screen name='HelpAndSupport' component={HelpAndSupport} />
              <Stack.Screen name='AboutUs' component={AboutUs} />
              <Stack.Screen name='TermsAndConditions' component={TermsAndConditions} />
              <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicy} />
              {/* <Stack.Screen name='ReferCodeScreen' component={ReferCodeScreen} /> */}
              <Stack.Screen name='ReferralPage' component={ReferralPage} />
              <Stack.Screen name='ProductCheckoutPage' component={ProductCheckoutPage} />
              <Stack.Screen name='ProductHistory' component={ProductHistory} />
              <Stack.Screen name='ProductDetailsPage' component={ProductDetailsPage} />
            </>
          )}
        </Stack.Navigator>

        {/* Version Update Modal */}
        <Modal isVisible={showUpdateModal} style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeader}>Update Available</Text>
            <Text style={styles.modalText}>
              A new version of the app is available. Please update to version <Text style={styles.modalVersion}>{latestVersion}</Text> for the best experience.
            </Text>
            <View style={styles.modalButtonContainer}>
              <Text
                style={styles.modalButton}
                onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.thirtythreecroresapp')}
              >
                Update Now
              </Text>
            </View>
          </View>
        </Modal>

      </NavigationContainer>
    </TabProvider>
  )
}

export default App

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    width: '85%',
    alignItems: 'center',
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9170a', // Highlight color for the header
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalVersion: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalButtonContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: '#c9170a',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
  },
})