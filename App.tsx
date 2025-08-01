import { StyleSheet, Text, View, StatusBar, Linking, BackHandler } from 'react-native'
import React, { useEffect, useState } from 'react'
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import Modal from 'react-native-modal';
import NetInfo from "@react-native-community/netinfo";
// import VersionCheck from 'react-native-version-check';
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
import CustomOrderScreen from './src/Screen/CustomOrderScreen/Index';
import NewHome from './src/Screen/BTN_Tab/NewHome'
import Category from './src/Screen/BTN_Tab/Category'
import Subscribe from './src/Screen/BTN_Tab/Subscribe'
import NewProfile from './src/Screen/BTN_Tab/NewProfile'

const Stack = createStackNavigator();

// export const base_url = "https://panditapp.mandirparikrama.com/"
export const base_url = "https://pandit.33crores.com/"

const App = () => {

  const [showSplash, setShowSplash] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
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

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 5000)
  }, []);

  return (
    <TabProvider>
      <NavigationContainer>
        <StatusBar backgroundColor="#c9170a" barStyle="light-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showSplash ? (<Stack.Screen name="SplashScreen" component={SplashScreen} options={{ presentation: 'modal', animationTypeForReplace: 'push', animation: 'slide_from_right' }} />) : null}
          {!isConnected ? (
            <Stack.Screen name="NoInternet" component={NoInternet} />
          ) : (
            <>
              <Stack.Screen name='BTN_Layout' component={BTN_Layout} />
              <Stack.Screen name='Login' component={Login} />
              <Stack.Screen name='OTP' component={OTP} />
              <Stack.Screen name='CustomOrderScreen' component={CustomOrderScreen} />
              <Stack.Screen name='NewHome' component={NewHome} />
              <Stack.Screen name='Category' component={Category} />
              <Stack.Screen name='Subscribe' component={Subscribe} />
              <Stack.Screen name='NewProfile' component={NewProfile} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </TabProvider>
  )
}

export default App

const styles = StyleSheet.create({})