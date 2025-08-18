import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../../App';
import DeviceInfo from 'react-native-device-info';
import { getMessaging, getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import Notification from '../../component/Notification';

const OTP = (props) => {

    const navigation = useNavigation();
    const [otp, setOtp] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [access_token, setAccess_token] = useState('');
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        if (otp.length === 6) {
            pressHandler();
        }
    }, [otp]);

    const getAccessToken = async () => {
        try {
            const token = await AsyncStorage.getItem('storeAccesstoken');
            setAccess_token(token);
        } catch (error) {
            console.error('Failed to retrieve access token:', error);
        }
    };

    async function requestUserPermission() {
        const authStatus = await requestPermission(getMessaging());
        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            getFCMToken();
        }
    }

    async function getFCMToken() {
        try {
            const token = await getToken(getMessaging());
            setFcmToken(token);
        } catch (error) {
            console.log('Error getting FCM token:', error);
        }
    };

    useEffect(() => {
        getAccessToken();
        requestUserPermission();
    }, []);

    const pressHandler = async () => {
        let platformName = DeviceInfo.getSystemName();
        let deviceModel = DeviceInfo.getModel();
        setIsLoading(true);
        try {
            if (otp === "" || otp.length !== 6) {
                setErrorMessage('Please enter a valid OTP');
                setShowError(true);
                setTimeout(() => setShowError(false), 5000);
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            // formData.append('orderId', props.route.params.order_id);
            formData.append('otp', otp);
            formData.append('phoneNumber', props.route.params.phone);
            formData.append('device_id', fcmToken);
            formData.append('device_model', deviceModel);
            formData.append('platform', platformName);

            // console.log("Form Data:", formData);
            // return;

            const response = await fetch(base_url + "api/verify-otpless", {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                console.log("OTP verified successfully", data.user.referral_code);
                await AsyncStorage.setItem('storeAccesstoken', data.token);
                await AsyncStorage.setItem('isReferCodeApply', JSON.stringify(data.user.code_status));
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                navigation.navigate('BTN_Layout');
            } else {
                setErrorMessage(data.message || 'Failed to Login. Please try again.');
                setShowError(true);
                setTimeout(() => setShowError(false), 5000);
            }
        } catch (error) {
            setErrorMessage('Failed to Login. Please try again.');
            setShowError(true);
            console.log("Error:", error);
            setTimeout(() => setShowError(false), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
            {access_token && <Notification />}
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
                    <Text style={styles.titleText}>Enter OTP For Login</Text>
                    <View style={styles.inputWrapper}>
                        {(isFocused || otp.length > 0) && (
                            <Text style={styles.floatingLabel}>OTP</Text>
                        )}
                        <TextInput
                            style={styles.textInput}
                            value={otp}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            maxLength={6}
                            keyboardType="numeric"
                            onChangeText={value => setOtp(value)}
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

export default OTP;

const styles = StyleSheet.create({
    footer: {
        height: 135,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: 10,
        marginTop: 10,
    },
    titleText: {
        fontSize: 16,
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