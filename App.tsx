import { StyleSheet, StatusBar, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Modal from 'react-native-modal';
import NetInfo from "@react-native-community/netinfo";
// import VersionCheck from 'react-native-version-check';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { getMessaging, getToken, setBackgroundMessageHandler, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import Notification from './src/component/Notification';
import { TabProvider } from './src/Screen/TabContext';

// SplashScreen
import SplashScreen from './src/Screen/SplashScreen/Index'

// No Internet Page
import NoInternet from './src/Screen/NoInternet/Index'

// Auth
import Login from './src/Screen/Auth/Login'
import OTP from './src/Screen/Auth/OTP'

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
import MyOrder from './src/Screen/MyOrder/Index'
import Address from './src/Screen/Address/Index'
import Notificationpage from './src/Screen/Notificationpage/Index'
import HelpAndSupport from './src/Screen/HelpAndSupport/Index'
import AboutUs from './src/Screen/AboutUs/Index'
import TermsAndConditions from './src/Screen/TermsAndConditions/Index'
import PrivacyPolicy from './src/Screen/PrivacyPolicy/Index'

const Stack = createStackNavigator();

// export const base_url = "https://panditapp.mandirparikrama.com/"
export const base_url = "https://pandit.33crores.com/"

const App = () => {

  const [showSplash, setShowSplash] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // const [showUpdateModal, setShowUpdateModal] = useState(false);
  // const [latestVersion, setLatestVersion] = useState('');

  // useEffect(() => {
  //   const checkForUpdates = async () => {
  //     try {
  //       const currentVersion = await VersionCheck.getCurrentVersion();
  //       const storeVersion = await VersionCheck.getLatestVersion({
  //         provider: 'playStore',
  //       });

  //       console.log("storeVersion:", storeVersion);
  //       console.log("currentVersion:", currentVersion);

  //       const updateInfo = await VersionCheck.needUpdate({
  //         currentVersion,
  //         latestVersion: storeVersion,
  //       });

  //       if (updateInfo && updateInfo.isNeeded) {
  //         setLatestVersion(storeVersion);
  //         setShowUpdateModal(true);
  //         console.log("Update is required to version:", storeVersion);
  //       } else {
  //         console.log("No update needed or updateInfo is null");
  //       }
  //     } catch (error) {
  //       console.error('Error checking app version:', error);
  //     }
  //   };

  //   checkForUpdates();
  // }, []);

  // useEffect(() => {
  //   const handleBackPress = () => {
  //     if (showUpdateModal) {
  //       return true; // Prevent default behavior (closing the modal)
  //     }
  //     return false; // Allow default behavior
  //     // BackHandler.exitApp();
  //   };

  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

  //   return () => {
  //     backHandler.remove();
  //   };
  // }, [showUpdateModal]);

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
    setTimeout(() => {
      setShowSplash(false);
    }, 5000)
  }, []);

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
        <Notification />
        <StatusBar backgroundColor="#c9170a" barStyle="light-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showSplash ? (<Stack.Screen name="SplashScreen" component={SplashScreen} options={{ presentation: 'modal', animationTypeForReplace: 'push', animation: 'slide_from_right' }} />) : null}
          {!isConnected ? (
            <Stack.Screen name="NoInternet" component={NoInternet} />
          ) : (
            <>
              {accessToken ? <Stack.Screen name="BTN_Layout" component={BTN_Layout} /> : <Stack.Screen name="Login" component={Login} />}
              {!accessToken ? <Stack.Screen name="BTN_Layout" component={BTN_Layout} /> : <Stack.Screen name="Login" component={Login} />}
              {/* <Stack.Screen name='BTN_Layout' component={BTN_Layout} /> */}
              <Stack.Screen name='OTP' component={OTP} />
              <Stack.Screen name='SubscriptionCheckoutPage' component={SubscriptionCheckoutPage} />
              <Stack.Screen name='CustomOrderScreen' component={CustomOrderScreen} />
              <Stack.Screen name='NewHome' component={NewHome} />
              <Stack.Screen name='Category' component={Category} />
              <Stack.Screen name='Subscribe' component={Subscribe} />
              <Stack.Screen name='NewProfile' component={NewProfile} />
              <Stack.Screen name='Notificationpage' component={Notificationpage} />
              <Stack.Screen name='MyOrder' component={MyOrder} />
              <Stack.Screen name='SubscriptionOrderHistory' component={SubscriptionOrderHistory} />
              <Stack.Screen name='CustomOrderHistory' component={CustomOrderHistory} />
              <Stack.Screen name='Address' component={Address} />
              <Stack.Screen name='HelpAndSupport' component={HelpAndSupport} />
              <Stack.Screen name='AboutUs' component={AboutUs} />
              <Stack.Screen name='TermsAndConditions' component={TermsAndConditions} />
              <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicy} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </TabProvider>
  )
}

export default App

const styles = StyleSheet.create({})