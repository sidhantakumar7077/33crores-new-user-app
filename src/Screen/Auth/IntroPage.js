// IntroPage.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    ImageBackground,
    StatusBar,
    Pressable,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        key: 'daily',
        title: 'Fresh flowers, every morning',
        body: 'Subscribe monthly and get flowers delivered to your door each morning. Renew before it ends to keep it going.',
        imageUri: require('../../assets/images/subscription.png'),
    },
    {
        key: 'pause',
        title: 'Pause & resume anytime',
        body: 'Need a break? Pause your subscription and resume whenever you like. Your end date extends automatically, so you never lose days.',
        imageUri: require('../../assets/images/pauseresume.png'),
    },
    {
        key: 'custom',
        title: 'Customize for festivals & events',
        body: 'Planning for a festival or a special moment? Personalize your order with the flowers you want, just the way you want them.',
        imageUri: require('../../assets/images/customised.png'),
        showPetals: true,
    },
];

const IntroPage = () => {

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const scrollX = useRef(new Animated.Value(0)).current;
    const listRef = useRef(null);
    const [index, setIndex] = useState(0);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

    // CTA button entrance animation
    const ctaY = useRef(new Animated.Value(30)).current;
    const ctaScale = useRef(new Animated.Value(0.95)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.spring(ctaY, { toValue: 0, useNativeDriver: true, bounciness: 8 }),
            Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
        ]).start();
    }, [index]);

    const onDone = async () => {
        try {
            await AsyncStorage.setItem('hasSeenIntro', 'true');
        } catch (e) {
            // ignore write error, still proceed
        }
        navigation.replace('NewLogin');
    };

    const goNext = () => {
        const next = Math.min(index + 1, SLIDES.length - 1);
        if (next === index && index === SLIDES.length - 1) {
            onDone?.();
            return;
        }
        listRef.current?.scrollToIndex({ index: next, animated: true });
    };

    const skip = () => {
        listRef.current?.scrollToIndex({ index: SLIDES.length - 1, animated: true });
    };

    const renderItem = ({ item, index: i }) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

        // Parallax + subtle zoom for image
        const imageTranslateX = scrollX.interpolate({
            inputRange,
            outputRange: [-width * 0.18, 0, width * 0.18],
        });
        const imageScale = scrollX.interpolate({
            inputRange,
            outputRange: [1.05, 1, 1.05],
        });

        // Text reveal
        const titleOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0] });
        const titleY = scrollX.interpolate({ inputRange, outputRange: [16, 0, -16] });
        const bodyOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0] });
        const bodyY = scrollX.interpolate({ inputRange, outputRange: [20, 0, -20] });

        return (
            <View style={{ width }}>
                <Animated.View style={{ transform: [{ translateX: imageTranslateX }, { scale: imageScale }] }}>
                    <ImageBackground source={item.imageUri} resizeMode="cover" style={styles.image}>
                        <View style={styles.imageOverlay} />
                        {/* Optional floating petals (festival slide) */}
                        {item.showPetals ? <FloatingPetals /> : null}
                    </ImageBackground>
                </Animated.View>

                <View style={styles.cardWrap}>
                    <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                        {item.title}
                    </Animated.Text>
                    <Animated.Text style={[styles.body, { opacity: bodyOpacity, transform: [{ translateY: bodyY }] }]}>
                        {item.body}
                    </Animated.Text>
                </View>
            </View>
        );
    };

    const Indicator = () => (
        <View style={styles.indicatorRow}>
            {SLIDES.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const widthAnim = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8] });
                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4] });
                return <Animated.View key={i} style={[styles.dot, { width: widthAnim, opacity }]} />;
            })}
        </View>
    );

    // progress bar across footer
    const progress = Animated.divide(scrollX, width); // 0..(slides-1)
    const barWidth = progress.interpolate({
        inputRange: [0, SLIDES.length - 1],
        outputRange: [0, (width - 40)], // footer horizontal padding 20 * 2
        extrapolate: 'clamp',
    });

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" />

            <Animated.FlatList
                ref={listRef}
                data={SLIDES}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                horizontal
                bounces={false}
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewConfigRef.current}
            />

            <View style={styles.footer}>
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressBar, { width: barWidth }]} />
                </View>

                <Indicator />

                <View style={styles.ctaRow}>
                    {/* {index < SLIDES.length - 1 ? (
                        <Pressable onPress={skip} hitSlop={8} style={[styles.btn, styles.btnGhost]}>
                            <Text style={[styles.btnText, styles.btnGhostText]}>Skip</Text>
                        </Pressable>
                    ) : (
                        <View style={{ width: 96 }} />
                    )} */}
                    <View style={{ width: 96 }} />

                    {/* <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.btn}> */}
                    <Animated.View style={{ transform: [{ translateY: ctaY }, { scale: ctaScale }] }}>
                        <Pressable
                            onPress={index === SLIDES.length - 1 ? onDone : goNext}
                            hitSlop={8}
                            style={[styles.btn, styles.btnSolid]}
                        >
                            <Text style={styles.btnText}>{index === SLIDES.length - 1 ? 'Get started' : 'Next'}</Text>
                        </Pressable>
                    </Animated.View>
                    {/* </LinearGradient> */}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default IntroPage;

/* ---------- Decorative Petals (no extra libs) ---------- */
const PETALS = new Array(8).fill(0).map((_, i) => i);
const FloatingPetals = () => {
    const anims = useRef(PETALS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        anims.forEach((a, idx) => {
            const loop = () =>
                Animated.sequence([
                    Animated.timing(a, {
                        toValue: 1,
                        duration: 5000 + idx * 300,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: true }),
                ]).start(loop);
            loop();
        });
    }, [anims]);

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {anims.map((a, i) => {
                const startX = (i / PETALS.length) * width;
                const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [height * 0.3, -20] });
                const translateX = a.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [startX, startX + (i % 2 ? 30 : -30), startX],
                });
                const rotate = a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${i % 2 ? 25 : -25}deg`] });
                const opacity = a.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.7, 0.7, 0] });
                return (
                    <Animated.View
                        key={i}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            transform: [{ translateX }, { translateY }, { rotate }],
                            opacity,
                        }}
                    >
                        <View style={styles.petal} />
                    </Animated.View>
                );
            })}
        </View>
    );
};

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F59E0B', // deeper slate
    },
    image: {
        width,
        height: height * 0.6,
        justifyContent: 'flex-end',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
    },
    cardWrap: {
        marginTop: -46,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(17, 24, 39, 0.8)', // glassy panel
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.2,
        marginBottom: 8,
    },
    body: {
        fontSize: 16,
        lineHeight: 22,
        color: 'rgba(255,255,255,0.9)',
    },
    indicatorRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginVertical: 10,
    },
    dot: {
        height: 8,
        borderRadius: 8,
        backgroundColor: 'white',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    progressTrack: {
        height: 4,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#22C55E',
    },
    ctaRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    btn: {
        minWidth: 110,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSolid: {
        backgroundColor: 'rgba(0, 0, 0, 0.59)',
    },
    btnGhost: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'transparent',
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    btnGhostText: {
        color: 'rgba(255,255,255,0.9)',
    },
    petal: {
        width: 14,
        height: 8,
        borderRadius: 8,
        backgroundColor: '#f59e0b', // warm gold
        transform: [{ rotate: '35deg' }],
    },
});