import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';
import { getMessaging, getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { base_url } from '../../../App';

const { height } = Dimensions.get('window');

const PHONE_REGEX = /^\+91\d{10}$/;

const maskPhone = (p = '') => {
    if (!p) return '';
    const cc = p.startsWith('+') ? p.slice(0, 3) : '';
    const digits = p.replace(/^\+91/, '');
    const visible = digits.slice(-4);
    const masked = digits.slice(0, -4).replace(/\d/g, '•');
    return `${cc}${masked}${visible}`;
};

const NewLogin = () => {

    const navigation = useNavigation();

    // Steps: 'phone' -> 'otp'
    const [step, setStep] = useState('phone');

    // Phone
    const [phone, setPhone] = useState('+91');
    const [isPhoneFocused, setIsPhoneFocused] = useState(false);

    // OTP
    const [otp, setOtp] = useState('');
    const [isOtpFocused, setIsOtpFocused] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const timerRef = useRef(null);

    // Common
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [fcmToken, setFcmToken] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const masked = useMemo(() => maskPhone(phone), [phone]);
    const canSend = PHONE_REGEX.test(phone);
    const canVerify = otp.length === 6;

    // Nice entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim, scaleAnim]);

    // Request notifications and fetch FCM token (same behavior you had before)
    useEffect(() => {
        (async () => {
            try {
                const authStatus = await requestPermission(getMessaging());
                const enabled =
                    authStatus === AuthorizationStatus.AUTHORIZED ||
                    authStatus === AuthorizationStatus.PROVISIONAL;
                if (enabled) {
                    const token = await getToken(getMessaging());
                    setFcmToken(token);
                }
            } catch {
                // non-fatal
            }
        })();
    }, []);

    const startResendTimer = () => {
        setResendTimer(30);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setResendTimer((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };

    // Start / reset resend timer on OTP step
    useEffect(() => {
        if (step !== 'otp') return;
        // setResendTimer(30);
        // if (timerRef.current) clearInterval(timerRef.current);
        // timerRef.current = setInterval(() => {
        //     setResendTimer((t) => {
        //         if (t <= 1) {
        //             clearInterval(timerRef.current);
        //             return 0;
        //         }
        //         return t - 1;
        //     });
        // }, 1000);
        startResendTimer();
        return () => timerRef.current && clearInterval(timerRef.current);
    }, [step]);

    const showError = (msg) => {
        setErr(msg);
        setTimeout(() => setErr(''), 6000);
    };

    // === API CALLS (kept from your previous logic) ===
    const handleSendOtp = async () => {
        if (!canSend) {
            showError('Please enter a valid WhatsApp number (e.g., +919876543210)');
            return false;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('phone', phone);

            const res = await fetch(`${base_url}api/send-otp`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) {
                showError(data?.message || 'Failed to send OTP. Please try again.');
                return false;
            }
            setStep('otp');
            setOtp('');
            return true;
        } catch (e) {
            showError('Failed to send OTP. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!canVerify) {
            showError('Please enter the 6-digit OTP');
            return;
        }
        setLoading(true);
        try {
            const platformName = DeviceInfo.getSystemName();
            const deviceModel = DeviceInfo.getModel();

            const formData = new FormData();
            formData.append('otp', otp);
            formData.append('phoneNumber', phone);
            formData.append('device_id', fcmToken || '');
            formData.append('device_model', deviceModel);
            formData.append('platform', platformName);

            // console.log("Verifying OTP with data:", { otp, phone, fcmToken, deviceModel, platformName });
            // return;

            const res = await fetch(`${base_url}api/verify-otpless`, { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok) {
                console.log("OTP verified successfully", data.user);
                await AsyncStorage.setItem('storeAccesstoken', data.token);
                await AsyncStorage.setItem('isReferCodeApply', JSON.stringify(data.user.code_status));
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                if (!data.user.name) {
                    navigation.navigate('ProfileSetup', { phone });
                } else {
                    navigation.replace('BTN_Layout');
                }
            } else {
                showError(data?.message || 'Failed to verify OTP. Please try again.');
                console.log("OTP verification failed", data);
            }
        } catch (e) {
            showError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        // await handleSendOtp();
        const ok = await handleSendOtp();
        // When already on 'otp', the step doesn't change, so manually restart the timer
        if (ok && step === 'otp') {
            startResendTimer();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FFEDD5" />

            {/* Background gradient + soft shapes */}
            <LinearGradient
                colors={['#FBBF24', '#F59E0B', '#f18204ff']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.floatingCircle, styles.circle1]} />
                <View style={[styles.floatingCircle, styles.circle2]} />
                <View style={[styles.floatingCircle, styles.circle3]} />
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[
                            styles.content,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
                        ]}
                    >
                        {/* Header / branding */}
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <LinearGradient colors={['#ffffffff', '#ffffffff']} style={styles.logoGradient}>
                                    <Image source={require('../../assets/images/33logo.png')} style={{ width: 70, height: 70, resizeMode: 'contain' }} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.brandName}>33Crores</Text>
                            <Text style={styles.tagline}>Sacred flowers delivered fresh</Text>
                        </View>

                        {/* Main Card */}
                        <View style={styles.card}>
                            {/* Progress */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: step === 'phone' ? '50%' : '100%' }]} />
                                </View>
                                <Text style={styles.progressText}>Step {step === 'phone' ? '1' : '2'} of 2</Text>
                            </View>

                            {step === 'phone' ? (
                                <>
                                    <View style={styles.stepHeader}>
                                        <Text style={styles.stepTitle}>Enter your number</Text>
                                        <Text style={styles.stepSubtitle}>
                                            We’ll send you a verification code via WhatsApp
                                        </Text>
                                    </View>

                                    <View style={styles.inputSection}>
                                        <View
                                            style={[
                                                styles.inputContainer,
                                                isPhoneFocused && styles.inputFocused,
                                                !!err && styles.inputError,
                                            ]}
                                        >
                                            <View style={styles.iconWrap}>
                                                <Feather name="phone" size={20} color="#6366F1" />
                                            </View>
                                            <TextInput
                                                value={phone}
                                                onChangeText={(val) => {
                                                    if (val.startsWith('+91')) {
                                                        setPhone(val.replace(/[^+\d]/g, '').slice(0, 13));
                                                    } else {
                                                        setPhone('+91');
                                                    }
                                                }}
                                                // onFocus={() => setIsPhoneFocused(true)}
                                                // onBlur={() => setIsPhoneFocused(false)}
                                                keyboardType="phone-pad"
                                                maxLength={13}
                                                placeholder="+91 XXXXX XXXXX"
                                                placeholderTextColor="#070809ff"
                                                style={styles.textInput}
                                            />
                                        </View>

                                        {!!err && <Text style={styles.errorText}>{err}</Text>}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.primaryButton, !canSend && styles.buttonDisabled]}
                                        disabled={!canSend || loading}
                                        onPress={handleSendOtp}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={canSend ? ['#F59E0B', '#f18204ff'] : ['#D1D5DB', '#9CA3AF']}
                                            style={styles.buttonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <View style={styles.btnRow}>
                                                    <Feather name="message-circle" size={18} color="#fff" />
                                                    <Text style={styles.buttonText}>Send Code</Text>
                                                </View>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={styles.stepHeader}>
                                        <Text style={styles.stepTitle}>Verify your number</Text>
                                        <Text style={styles.stepSubtitle}>Enter the 6-digit code sent to {phone} <Text style={{ fontWeight: 'bold', color: '#0e90fbff' }}>(WhatsApp)</Text></Text>
                                    </View>

                                    <View style={styles.inputSection}>
                                        <View
                                            style={[
                                                styles.inputContainer,
                                                isOtpFocused && styles.inputFocused,
                                                !!err && styles.inputError,
                                            ]}
                                        >
                                            <View style={styles.iconWrap}>
                                                <Feather name="shield" size={20} color="#6366F1" />
                                            </View>
                                            <TextInput
                                                value={otp}
                                                onChangeText={setOtp}
                                                // onFocus={() => setIsOtpFocused(true)}
                                                // onBlur={() => setIsOtpFocused(false)}
                                                keyboardType="numeric"
                                                maxLength={6}
                                                placeholder="• • • • • •"
                                                placeholderTextColor="#9CA3AF"
                                                style={[styles.textInput, styles.otpInput]}
                                            />
                                        </View>

                                        {!!err && <Text style={styles.errorText}>{err}</Text>}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.primaryButton, !canVerify && styles.buttonDisabled]}
                                        disabled={!canVerify || loading}
                                        onPress={handleVerifyOtp}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={canVerify ? ['#F59E0B', '#f18204ff'] : ['#D1D5DB', '#9CA3AF']}
                                            style={styles.buttonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <View style={styles.btnRow}>
                                                    <Feather name="check-circle" size={18} color="#fff" />
                                                    <Text style={styles.buttonText}>Verify Code</Text>
                                                </View>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {/* Resend */}
                                    <View style={styles.resendSection}>
                                        <Text style={styles.resendText}>Didn’t receive the code?</Text>
                                        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
                                            <Text
                                                style={[
                                                    styles.resendLink,
                                                    resendTimer > 0 ? styles.resendDisabled : null,
                                                ]}
                                            >
                                                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Back to phone */}
                                    <TouchableOpacity style={styles.backButton} onPress={() => setStep('phone')}>
                                        <Feather name="arrow-left" size={16} color="#6B7280" />
                                        <Text style={styles.backText}>Change number</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* Security blurb */}
                        {/* <View style={styles.securityFooter}>
                            <Feather name="lock" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.securityText}>Your data is encrypted and secure</Text>
                        </View> */}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default NewLogin;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#6366F1' },
    backgroundGradient: { ...StyleSheet.absoluteFillObject },
    floatingCircle: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100 },
    circle1: { width: 120, height: 120, top: 100, right: -30 },
    circle2: { width: 80, height: 80, top: 200, left: -20 },
    circle3: { width: 60, height: 60, bottom: 150, right: 50 },

    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
    content: { flex: 1, justifyContent: 'center', minHeight: height - 120 },

    header: { alignItems: 'center', marginBottom: 36 },
    logoContainer: { marginBottom: 18 },
    logoGradient: {
        width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#FBBF24', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
    },
    brandName: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
    tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: '500' },

    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },

    progressContainer: { marginBottom: 28 },
    progressBar: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 2 },
    progressText: { fontSize: 12, color: '#6B7280', fontWeight: '600', textAlign: 'center' },

    stepHeader: { marginBottom: 20, alignItems: 'center' },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
    stepSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

    inputSection: { marginBottom: 18 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 56,
    },
    inputFocused: { borderColor: '#6366F1', backgroundColor: '#fff', shadowColor: '#6366F1', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    iconWrap: { marginRight: 12 },
    textInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
    otpInput: { textAlign: 'center', letterSpacing: 8, fontSize: 18 },

    errorText: { marginTop: 8, fontSize: 14, color: '#EF4444', fontWeight: '500' },

    primaryButton: { height: 56, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    buttonDisabled: { opacity: 0.6 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    buttonText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: '#fff' },

    resendSection: { alignItems: 'center', marginTop: 4, marginBottom: 12 },
    resendText: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
    resendLink: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
    resendDisabled: { color: '#9CA3AF' },

    backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    backText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#6B7280' },

    securityFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    securityText: { marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
});
