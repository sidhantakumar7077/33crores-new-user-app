import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

const Notification = () => {

  // Create notification channel
  useEffect(() => {
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }, []);

  // Configure push notification settings
  useEffect(() => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log("LOCAL NOTIFICATION ==>", notification);
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }, []);

  // Foreground FCM notification handling
  useEffect(() => {
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

      PushNotification.localNotification({
        channelId: "default-channel-id",
        title: remoteMessage.notification?.title || '',
        message: remoteMessage.notification?.body || '',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        vibrate: true,
      });
    });

    return unsubscribe;
  }, []);

  // Background and quit state notification handling
  useEffect(() => {
    onNotificationOpenedApp(getMessaging(), remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage?.notification
      );
    });

    setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
      console.log(
        'Message handled in the background!',
        remoteMessage.notification
      );
    });

    getInitialNotification(getMessaging()).then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification
        );
      }
    });
  }, []);

  return <View />;
};

export default Notification;
