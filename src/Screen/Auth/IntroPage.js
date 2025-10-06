import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ViewToken,
} from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const videoData = [
    {
        id: '1',
        title: 'How to get a Subscription',
        description: 'Choose from our range of subscription plans and get fresh flowers delivered to your doorstep regularly.',
        video: require('../../assets/vedio/subscription.mp4'),
    },
    {
        id: '2',
        title: 'How to get a custom order',
        description: 'Select your favorite blooms and create a personalized bouquet for any occasion.',
        video: require('../../assets/vedio/custom.mp4'),
    },
    {
        id: '3',
        title: 'How to pause a subscription',
        description: 'Easily pause your subscription anytime and resume it when you\'re ready to receive more flowers.',
        video: require('../../assets/vedio/paused.mp4'),
    },
];

const IntroPage = () => {

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    // Keep track of which item is visible (more reliable than momentum end alone)
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
    const onViewableItemsChanged = useRef(
        ({ viewableItems }) => {
            if (viewableItems?.length > 0 && typeof viewableItems[0].index === 'number') {
                setCurrentIndex(viewableItems[0].index);
            }
        }
    ).current;

    const handleNext = useCallback(() => {
        if (currentIndex < videoData.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            navigation.replace('NewLogin');  // Navigate to login on last slide
        }
    }, [currentIndex, navigation]);

    const handleVideoEnd = useCallback(() => {
        // Auto-advance on end (optional)
        if (currentIndex < videoData.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    }, [currentIndex]);

    const renderItem = ({ item, index }) => (
        <View style={styles.slide}>
            <Video
                // ✅ pass local require directly
                source={item.video}
                style={styles.video}
                resizeMode="cover"
                repeat
                muted
                paused={currentIndex !== index}         // ✅ only play the visible one
                onEnd={handleVideoEnd}
                onError={(e) => console.log('Video error:', e?.nativeEvent)}
                ignoreSilentSwitch="ignore"             // iOS: play even in silent mode (muted anyway)
                playInBackground={false}
                playWhenInactive={false}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                style={styles.overlay}
            >
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.desc}>{item.description}</Text>
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <FlatList
                ref={flatListRef}
                data={videoData}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {videoData.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            { backgroundColor: i === currentIndex ? '#F59E0B' : '#ffffff50' },
                        ]}
                    />
                ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity activeOpacity={0.9} style={styles.nextBtnWrap} onPress={handleNext}>
                <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.nextBtn}>
                    <Text style={styles.nextText}>
                        {currentIndex === videoData.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Ionicons
                        name={currentIndex === videoData.length - 1 ? 'checkmark' : 'arrow-forward'}
                        size={22}
                        color="#fff"
                        style={{ marginLeft: 6 }}
                    />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

export default IntroPage;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    slide: { width, height },
    video: {
        width,
        height,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 24,
    },
    textContainer: {
        marginBottom: 120,
    },
    title: {
        fontSize: 28,
        color: '#fff',
        fontWeight: '800',
        marginBottom: 10,
    },
    desc: {
        fontSize: 16,
        color: '#e5e7eb',
        lineHeight: 22,
    },
    pagination: {
        position: 'absolute',
        bottom: 110,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    nextBtnWrap: {
        position: 'absolute',
        bottom: 45,
        alignSelf: 'center',
        width: width * 0.9,
    },
    nextBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    nextText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});