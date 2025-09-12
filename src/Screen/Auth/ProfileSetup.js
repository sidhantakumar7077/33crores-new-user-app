import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    Dimensions,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../../App';

const { height } = Dimensions.get('window');

const maskPhone = (p = '') => {
    if (!p) return '';
    const cc = p.startsWith('+') ? p.slice(0, 3) : '';
    const digits = p.replace(/^\+91/, '');
    const visible = digits.slice(-4);
    const masked = digits.slice(0, -4).replace(/\d/g, '•');
    return `${cc}${masked}${visible}`;
};

const formatDatePretty = (date) => {
    try {
        return date ? new Date(date).toLocaleDateString() : '';
    } catch {
        return '';
    }
};

const ProfileSetup = () => {

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const route = useRoute();
    const phoneFromLogin = route?.params?.phone;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim, scaleAnim]);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [about, setAbout] = useState('');
    const [gender, setGender] = useState(''); // 'Male' | 'Female' | 'Other'
    const [dobISO, setDobISO] = useState(''); // YYYY-MM-DD
    const [showDOBPicker, setShowDOBPicker] = useState(false);
    const [tncAccepted, setTncAccepted] = useState(false);

    const [saving, setSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    const maskedPhone = useMemo(() => maskPhone(phoneFromLogin), [phoneFromLogin]);

    // Convert ISO -> Date for the picker
    const dobDate = useMemo(
        () => (dobISO ? new Date(dobISO) : new Date(2000, 0, 1)),
        [dobISO]
    );

    const showError = (msg) => {
        setErrMsg(msg);
        setTimeout(() => setErrMsg(''), 5000);
    };

    const validateEmail = (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());

    const handleSave = async () => {
        try {
            const access_token = await AsyncStorage.getItem('storeAccesstoken');

            if (!name.trim()) {
                showError('Enter your name');
                return;
            }
            if (email.trim() && !validateEmail(email)) {
                showError('Enter a valid email address');
                return;
            }
            // ✅ Required: DOB
            if (!dobISO) {
                showError('Select your date of birth');
                return;
            }
            if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
                showError('Select a valid gender');
                return;
            }
            // ✅ Required: T&C
            if (!tncAccepted) {
                showError('Please accept the Terms & Conditions');
                return;
            }

            setSaving(true);

            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('email', email.trim());
            formData.append('gender', gender);
            formData.append('about', about.trim());
            formData.append('dob', dobISO);

            const response = await fetch(base_url + 'api/update-profile', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
                body: formData,
            });

            const responseData = await response.json();
            if (response.ok) {
                // Success → go to app home (or wherever you want)
                navigation.replace('BTN_Layout');
            } else {
                showError(responseData?.message || 'Failed to update profile');
            }
        } catch (error) {
            showError('Error updating profile. Please try again.');
            console.log('Edit profile error:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" backgroundColor="#FBBF24" />

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
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                    <Animated.View
                        style={[
                            styles.content,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
                        ]}
                    >
                        {/* Main Card */}
                        <View style={styles.card}>
                            <View style={styles.stepHeader}>
                                <Text style={styles.stepTitle}>Complete your profile</Text>
                                {!!phoneFromLogin && (
                                    <Text style={styles.stepSubtitle}>Linked with {phoneFromLogin}</Text>
                                )}
                            </View>

                            {/* Name */}
                            <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
                            <View style={styles.inputWrap}>
                                <Feather name="user" size={18} color="#64748B" style={{ marginRight: 8 }} />
                                <TextInput
                                    placeholder="Your Name"
                                    placeholderTextColor="#94A3B8"
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            {/* Email */}
                            <Text style={styles.label}>Email <Text style={styles.req}>*</Text></Text>
                            <View style={styles.inputWrap}>
                                <Feather name="mail" size={18} color="#64748B" style={{ marginRight: 8 }} />
                                <TextInput
                                    placeholder="you@example.com"
                                    placeholderTextColor="#94A3B8"
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            {/* DOB — inline DatePicker (no Modal) */}
                            <Text style={styles.label}>Date of Birth <Text style={styles.req}>*</Text></Text>
                            <TouchableOpacity
                                style={[styles.inputWrap, { justifyContent: 'space-between' }]}
                                onPress={() => setShowDOBPicker(true)}
                                activeOpacity={0.9}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Feather name="calendar" size={18} color="#64748B" style={{ marginRight: 8 }} />
                                    <Text style={[styles.input, { color: dobISO ? '#111827' : '#94A3B8' }]}>
                                        {dobISO ? formatDatePretty(dobISO) : 'Select Date of Birth'}
                                    </Text>
                                </View>
                                <Feather name="chevron-right" size={18} color="#64748B" />
                            </TouchableOpacity>

                            <DatePicker
                                modal
                                open={showDOBPicker}
                                date={dobDate}
                                mode="date"
                                maximumDate={new Date()}           // disallow future
                                minimumDate={new Date(1900, 0, 1)} // sensible min
                                onConfirm={(d) => {
                                    setShowDOBPicker(false);
                                    setDobISO(d.toISOString().slice(0, 10));
                                }}
                                onCancel={() => setShowDOBPicker(false)}
                            />

                            {/* About */}
                            <Text style={styles.label}>About Yourself</Text>
                            <View style={[styles.inputWrap, { height: 100, alignItems: 'flex-start', paddingVertical: 10 }]}>
                                <Feather name="message-circle" size={18} color="#64748B" style={{ marginRight: 8, marginTop: 4 }} />
                                <TextInput
                                    placeholder="A few lines about you"
                                    placeholderTextColor="#94A3B8"
                                    style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                                    value={about}
                                    onChangeText={setAbout}
                                    multiline
                                />
                            </View>

                            {/* Gender */}
                            <Text style={styles.label}>Gender <Text style={styles.req}>*</Text></Text>
                            <View style={styles.genderRow}>
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.genderPill, gender === g && styles.genderPillActive]}
                                        onPress={() => setGender(g)}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[styles.genderText, gender === g && { color: '#065F46', fontWeight: '800' }]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.tncRow}>
                                <TouchableOpacity
                                    onPress={() => setTncAccepted((v) => !v)}
                                    activeOpacity={0.8}
                                    style={[styles.checkbox, tncAccepted && styles.checkboxChecked]}
                                >
                                    {tncAccepted ? <Feather name="check" size={16} color="#fff" /> : null}
                                </TouchableOpacity>
                                <Text style={styles.tncText}>
                                    I accept the <Text
                                        style={styles.tncLink}
                                        onPress={() => { navigation.navigate('TermsAndConditions') }}
                                    >
                                        Terms & Conditions
                                    </Text>
                                </Text>
                            </View>

                            {/* Error (if any) */}
                            {!!errMsg && <Text style={styles.errorText}>{errMsg}</Text>}

                            {/* Save */}
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    { marginTop: 18 },
                                    (
                                        !name.trim() ||
                                        !email.trim() ||
                                        !dobISO ||
                                        !gender ||
                                        !tncAccepted ||
                                        saving
                                    ) && { opacity: 0.6 },
                                ]}
                                activeOpacity={0.9}
                                onPress={handleSave}
                                disabled={
                                    !name.trim() ||
                                    !email.trim() ||
                                    !dobISO ||
                                    !gender ||
                                    !tncAccepted ||
                                    saving
                                }
                            >
                                <LinearGradient colors={['#F59E0B', '#f18204ff']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Continue</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ProfileSetup;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#6366F1' },
    backgroundGradient: { ...StyleSheet.absoluteFillObject },
    floatingCircle: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100 },
    circle1: { width: 120, height: 120, top: 100, right: -30 },
    circle2: { width: 80, height: 80, top: 200, left: -20 },
    circle3: { width: 60, height: 60, bottom: 150, right: 50 },

    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    content: { flex: 1, justifyContent: 'center', minHeight: height - 120 },

    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 44,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },

    stepHeader: { marginBottom: 16, alignItems: 'center' },
    stepTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6, textAlign: 'center' },
    stepSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

    label: { color: '#0f172a', fontWeight: '800', marginTop: 12, marginBottom: 6 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', paddingHorizontal: 14, height: 56,
    },
    input: { flex: 1, color: '#111827', fontWeight: '600' },

    pickerWrap: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    genderRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
    genderPill: {
        paddingHorizontal: 14,
        height: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    genderPillActive: { borderColor: '#065F46', backgroundColor: '#ECFDF5' },
    genderText: { color: '#334155', fontWeight: '700' },

    errorText: { color: '#EF4444', marginTop: 12, fontWeight: '700' },

    primaryButton: { height: 56, borderRadius: 16, overflow: 'hidden' },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    buttonText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    securityFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    securityText: { marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    req: {
        color: '#EF4444',
        fontWeight: '900',
    },

    tncRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        gap: 10,
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },

    checkboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    tncText: {
        color: '#0c0c0cff',
        fontWeight: '600',
    },

    tncLink: {
        color: '#1234afff',
        textDecorationLine: 'underline',
    },
});