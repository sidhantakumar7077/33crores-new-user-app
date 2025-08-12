// ReferCodeScreen.js (Updated with Close Icon & Skip Button)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PETAL_COUNT = 8;

export default function ReferCodeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Floating petals
    const petals = useMemo(
        () =>
            Array.from({ length: PETAL_COUNT }).map((_, i) => ({
                translateY: new Animated.Value(screenHeight + 100),
                translateX: new Animated.Value(0),
                rotate: new Animated.Value(0),
                scale: new Animated.Value(0.8 + Math.random() * 0.4),
                delay: i * 500,
                startX: Math.random() * (screenWidth - 60) + 30,
            })),
        []
    );

    useEffect(() => {
        let isMounted = true;
        const startPetalAnimation = (petal) => {
            if (!isMounted) return;
            petal.translateY.setValue(screenHeight + 100);
            petal.translateX.setValue(0);
            petal.rotate.setValue(0);

            const dur = 8000 + Math.random() * 2000;

            Animated.sequence([
                Animated.delay(petal.delay),
                Animated.parallel([
                    Animated.timing(petal.translateY, {
                        toValue: -100,
                        duration: dur,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(petal.translateX, {
                        toValue: (Math.random() - 0.5) * 100,
                        duration: dur,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(petal.rotate, {
                        toValue: 1,
                        duration: dur,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => startPetalAnimation(petal));
        };

        petals.forEach(startPetalAnimation);

        return () => {
            isMounted = false;
            petals.forEach((petal) => {
                petal.translateY.stopAnimation();
                petal.translateX.stopAnimation();
                petal.rotate.stopAnimation();
            });
        };
    }, [petals]);

    // Pulse animation
    const pulseScale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseScale, {
                    toValue: 1.05,
                    duration: 1000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseScale, {
                    toValue: 1.0,
                    duration: 1000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseScale]);

    // Card entrance
    const cardScale = useRef(new Animated.Value(0.9)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardScale, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const validateCode = () => {
        const trimmed = code.trim();
        if (!trimmed) {
            setError('Please enter a referral code.');
            return false;
        }
        if (trimmed.length < 4) {
            setError('Code must be at least 4 characters.');
            return false;
        }
        if (!/^[A-Z0-9]+$/.test(trimmed)) {
            setError('Code can only contain letters and numbers.');
            return false;
        }
        setError('');
        return true;
    };

    const handleApplyCode = async () => {
        if (loading) return;
        if (!validateCode()) return;

        try {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            Alert.alert('Success! 🎉', 'Referral code applied successfully!', [
                { text: 'Continue', onPress: () => navigation.goBack() },
            ]);
        } catch {
            Alert.alert('Error', 'Please check your code and try again.', [{ text: 'OK' }]);
        } finally {
            setLoading(false);
        }
    };

    const PetalComponent = ({ index }) => {
        const petal = petals[index];
        const rotate = petal.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });
        const size = 16 + Math.random() * 12;
        return (
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.petal,
                    {
                        left: petal.startX,
                        width: size,
                        height: size,
                        transform: [
                            { translateY: petal.translateY },
                            { translateX: petal.translateX },
                            { rotate },
                            { scale: petal.scale },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF4500']}
                    style={styles.petalGradient}
                />
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <LinearGradient
                    colors={['#FF512F', '#F09819', '#FDC830']}
                    style={styles.background}
                >
                    {Array.from({ length: PETAL_COUNT }).map((_, i) => (
                        <PetalComponent key={i} index={i} />
                    ))}

                    {/* Header with Close Icon */}
                    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                        <LinearGradient
                            colors={['#FF7E5F', '#FEB47B']}
                            style={styles.headerBg}
                        >
                            <Text style={styles.headerTitle}>Enter Refer Code</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Icon name="times" size={18} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    {/* Main Content */}
                    <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
                        <Animated.View
                            style={[
                                styles.cardWrapper,
                                { transform: [{ scale: cardScale }], opacity: cardOpacity },
                            ]}
                        >
                            <LinearGradient
                                colors={['#F59E0B', '#F97316', '#FB923C']}
                                style={styles.cardBorder}
                            >
                                <View style={styles.card}>
                                    <View style={styles.giftIconContainer}>
                                        <LinearGradient
                                            colors={['#FFEDD5', '#FED7AA', '#FDBA74']}
                                            style={styles.giftIconBackground}
                                        >
                                            <Icon name="gift" size={28} color="#C2410C" />
                                        </LinearGradient>
                                    </View>

                                    <Text style={styles.title}>Unlock Your Reward</Text>
                                    <Text style={styles.subtitle}>
                                        Enter your friend's referral code and enjoy exclusive benefits.
                                    </Text>

                                    <Text style={styles.inputLabel}>Referral Code</Text>
                                    <View
                                        style={[
                                            styles.inputContainer,
                                            error ? styles.inputContainerError : null,
                                        ]}
                                    >
                                        <Icon name="ticket-alt" size={16} color="#9CA3AF" />
                                        <TextInput
                                            value={code}
                                            onChangeText={(text) =>
                                                setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                                            }
                                            placeholder="e.g., BAPPA2024"
                                            placeholderTextColor="#9CA3AF"
                                            style={styles.textInput}
                                            maxLength={20}
                                            autoCapitalize="characters"
                                            returnKeyType="done"
                                            onSubmitEditing={handleApplyCode}
                                        />
                                        {code.length > 0 && (
                                            <TouchableOpacity onPress={() => setCode('')}>
                                                <Icon name="times-circle" size={18} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                    {/* Apply Button */}
                                    <Animated.View
                                        style={[
                                            styles.buttonContainer,
                                            { transform: [{ scale: pulseScale }] },
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.applyButton,
                                                loading && styles.applyButtonDisabled,
                                            ]}
                                            onPress={handleApplyCode}
                                            disabled={loading}
                                        >
                                            <LinearGradient
                                                colors={
                                                    loading
                                                        ? ['#9CA3AF', '#6B7280']
                                                        : ['#FF6B35', '#F97316']
                                                }
                                                style={styles.buttonGradient}
                                            >
                                                <Icon name="heart" size={16} color="#fff" solid />
                                                <Text style={styles.buttonText}>
                                                    {loading ? 'Applying...' : 'Apply Code'}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>

                                    {/* Skip Button */}
                                    <TouchableOpacity
                                        style={styles.skipButton}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <Text style={styles.skipButtonText}>Skip for now</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    background: { flex: 1 },

    header: { paddingHorizontal: 20 },
    headerBg: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardWrapper: { width: '100%', maxWidth: 400 },
    cardBorder: { borderRadius: 28, padding: 3 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 24,
        alignItems: 'center',
    },
    giftIconContainer: { marginTop: -40, marginBottom: 16 },
    giftIconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    title: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },

    inputLabel: {
        alignSelf: 'flex-start',
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        marginBottom: 8,
    },
    inputContainerError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    textInput: { flex: 1, fontSize: 16, color: '#111827', marginLeft: 12 },
    errorText: { fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 8 },

    buttonContainer: { width: '100%', marginTop: 16 },
    applyButton: { borderRadius: 16, overflow: 'hidden' },
    applyButtonDisabled: { opacity: 0.7 },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    skipButton: { marginTop: 14 },
    skipButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },

    petal: { position: 'absolute', borderRadius: 50, opacity: 0.8 },
    petalGradient: { flex: 1, borderRadius: 50 },
});
