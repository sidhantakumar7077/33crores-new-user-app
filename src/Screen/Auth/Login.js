import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { base_url } from '../../../App';

const Login = () => {

  const navigation = useNavigation();
  const [phone, setPhone] = useState('+91');
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pressHandler = async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    try {
      const phoneRegex = /^\+91\d{10}$/;
      if (phone === "" || !phoneRegex.test(phone)) {
        setErrorMessage('Please enter a valid phone number');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('phone', phone);

      const response = await fetch(base_url + 'api/send-otp', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        let phone_orderId = {
          phone: phone,
          order_id: data.order_id
        };
        navigation.navigate('OTP', phone_orderId);
      } else {
        setErrorMessage(data.message || 'Failed to send OTP. Please try again.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      setErrorMessage('Failed to send OTP. Please try again.');
      setShowError(true);
      console.log("Error", error);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const requestSMSPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: 'SMS Permission',
            message: 'This app needs access to your SMS to read the OTP.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return false;
  };

  // useEffect(() => {
  //   requestSMSPermission();
  // }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
      <ImageBackground
        source={require('../../assets/images/Login_BG.png')}
        style={{ flex: 1, resizeMode: 'cover', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
          <Image
            source={require('../../assets/images/whitelogo.png')}
            style={{ height: 130, width: 130, resizeMode: 'contain' }}
          />
        </View>
        <View style={styles.footer}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.subText}>Login to continue</Text>

          <View style={styles.inputWrapper}>
            {(isFocused || phone.length > 3) && (
              <Text style={styles.floatingLabel}>Phone Number</Text>
            )}
            <TextInput
              style={styles.textInput}
              value={phone}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={13}
              keyboardType="phone-pad"
              onChangeText={value => {
                if (value.length >= 4 || value.startsWith('+91')) {
                  setPhone(value);
                } else {
                  setPhone('+91');
                }
              }}
            />
          </View>

          {showError && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
        <View style={styles.bottom}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#c80100" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={pressHandler}>
              <Text style={styles.buttonText}>SUBMIT</Text>
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  footer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 10,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'okra',
    fontWeight: 'bold',
    color: '#353535',
  },
  subText: {
    fontSize: 15,
    fontFamily: 'okra',
    fontWeight: '600',
    color: '#353535',
    marginBottom: 18,
  },
  inputWrapper: {
    width: '80%',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#353535',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 100,
    justifyContent: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#fff',
    fontSize: 12,
    color: '#c80100',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  textInput: {
    fontSize: 16,
    color: '#353535',
    width: 200,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 10,
    fontFamily: 'Titillium Web',
  },
  bottom: {
    flex: 0.5,
    backgroundColor: 'transparent',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    height: 45,
    width: 150,
    marginBottom: 12,
    backgroundColor: '#c80100',
    borderRadius: 100,
    alignItems: 'center',
    shadowOffset: { height: 10, width: 10 },
    shadowOpacity: 0.6,
    shadowColor: 'black',
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Titillium Web',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontSize: 14,
  },
});