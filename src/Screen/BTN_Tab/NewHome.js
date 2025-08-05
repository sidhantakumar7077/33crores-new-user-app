import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Dimensions,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { base_url } from '../../../App';
import { useTab } from '../TabContext';
import Drawer from '../../component/Drawer'
import Notification from '../../component/Notification';

const { width } = Dimensions.get('window');

const UPCOMING_FESTIVALS = [
    {
        id: '1',
        name: 'Durga Puja',
        date: 'Oct 15-19, 2024',
        daysLeft: 12,
        description: 'Special marigold and hibiscus arrangements',
        color: '#FF6B35',
        gradient: ['#FF6B35', '#F7931E', '#FBBF24'],
    },
    {
        id: '2',
        name: 'Diwali',
        date: 'Nov 1, 2024',
        daysLeft: 25,
        description: 'Premium flower decorations and diyas',
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#A855F7', '#C084FC'],
    },
    {
        id: '3',
        name: 'Kali Puja',
        date: 'Nov 1, 2024',
        daysLeft: 25,
        description: 'Red hibiscus and special offerings',
        color: '#10B981',
        gradient: ['#10B981', '#059669', '#047857'],
    },
];

const NewHome = () => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [spinner, setSpinner] = useState(false);
    const [allPackages, setAllPackages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef();
    const [offerDetails, setOfferDetails] = useState(null);
    const { setActiveTab } = useTab();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const closeModal = () => setIsModalVisible(false);

    const subscriptions = [
        {
            id: '1',
            title: 'Daily Pooja Subscription',
            subtitle: 'Fresh flowers delivered every morning before sunrise',
            price: '₹350',
            originalPrice: '₹600',
            interval: '/month',
            image: 'https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg',
            gradient: ['#1E293B', '#334155', '#475569'],
            buttonText: 'Start Subscription',
            buttonColor: '#8B5CF6',
        },
        {
            id: '2',
            title: 'Weekly Flower Delivery',
            subtitle: 'Weekly delivery of fresh flowers for your home',
            price: '₹1200',
            originalPrice: '₹1500',
            interval: '/week',
            image: 'https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg',
            gradient: ['#1E293B', '#334155', '#475569'],
            buttonText: 'Subscribe Now',
            buttonColor: '#10B981',
        },
        {
            id: '3',
            title: 'Monthly Flower Subscription',
            subtitle: 'Monthly delivery of seasonal flowers',
            price: '₹3000',
            originalPrice: '₹3500',
            interval: '/month',
            image: 'https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg',
            gradient: ['#1E293B', '#334155', '#475569'],
            buttonText: 'Join Now',
            buttonColor: '#F59E0B',
        },
    ];

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         const nextIndex = (activeIndex + 1) % subscriptions.length;
    //         flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    //         setActiveIndex(nextIndex);
    //     }, 10000); // 10 seconds

    //     return () => clearInterval(interval);
    // }, [activeIndex]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleCustomOrder = () => {
        navigation.navigate('CustomOrderScreen');
    };

    const getOfferDetails = async () => {
        try {
            const response = await fetch(`${base_url}api/offer-details`);
            const data = await response.json();

            if (response.ok) {
                // console.log('Offer details:', data.data[0]);
                setOfferDetails(data.data[0]);
            } else {
                console.error('Failed to fetch:', data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const getAllPackages = async () => {
        setSpinner(true);
        await fetch(base_url + 'api/products', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(response => response.json()).then(response => {
            if (response.status === 200) {
                // console.log("object", response.data);
                const filteredPackages = response.data.filter(item => item.category === "Subscription");
                setAllPackages(filteredPackages);
                setSpinner(false);
            } else {
                console.error('Failed to fetch packages:', response.message);
                setSpinner(false);
            }
            setSpinner(false);
        }).catch((error) => {
            console.error('Error:', error);
            setSpinner(false);
        });
    };

    useEffect(() => {
        if (isFocused) {
            getAllPackages();
            getOfferDetails();
        }
    }, [isFocused]);

    return (
        <SafeAreaView style={styles.container}>
            <Notification />
            <Drawer visible={isModalVisible} navigation={navigation} onClose={closeModal} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Hero Header with Gradient */}
                    <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                        <View style={styles.heroContent}>
                            <Image
                                source={require('../../assets/images/goldenLogo.png')}  // whitelogo.png
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <TouchableOpacity style={styles.menuIconContainer} onPress={() => setIsModalVisible(true)}>
                                <Icon name="bars" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.heroSubtitle}>
                                Fresh sacred flowers delivered to your doorstep every morning
                            </Text>
                            <View style={styles.heroStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>1000+</Text>
                                    <Text style={styles.statLabel}>Happy Devotees</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>Daily</Text>
                                    <Text style={styles.statLabel}>Fresh Delivery</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>Delivered to</Text>
                                    <Text style={styles.statLabel}>Home, Temple</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Subscribe or Customize Your Order"
                                editable={false}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#000"
                            />
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsContainer}>
                        <QuickAction
                            label="Custom Order"
                            icon="plus"
                            colors={['#8B5CF6', '#A855F7']}
                            onPress={() => navigation.navigate('CustomOrderScreen')}
                        />
                        <QuickAction label="Subscribe" icon="clock" colors={['#10B981', '#059669']} onPress={() => setActiveTab('subscribe')} />
                        <QuickAction label="Notification" icon="bell" colors={['#F59E0B', '#D97706']} onPress={() => navigation.navigate('Notificationpage')} />
                        <QuickAction label="My Orders" icon="truck" colors={['#EF4444', '#DC2626']} onPress={() => navigation.navigate('MyOrder')} />
                    </View>

                    {/* Premium Subscription Card */}
                    <View>
                        <FlatList
                            ref={flatListRef}
                            data={allPackages}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            decelerationRate="fast"
                            snapToAlignment="center"
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={[styles.subscriptionCard, { width: width - 40 }]}>
                                    <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.subscriptionGradient}>
                                        <View style={styles.subscriptionContent}>
                                            <View style={styles.subscriptionLeft}>
                                                <Text style={styles.subscriptionTitle}>{item.name}</Text>
                                                <Text style={styles.subscriptionSubtitle}>{item.description}</Text>
                                                <View style={styles.subscriptionPrice}>
                                                    <Text style={styles.priceText}>{item.price}</Text>
                                                    <Text style={styles.originalPrice}>{item.mrp}</Text>
                                                    <Text style={styles.priceInterval}>/ {item.duration} month</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.subscribeButton}
                                                >
                                                    <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <Image source={{ uri: item.product_image }} style={styles.subscriptionImage} />
                                        </View>
                                    </LinearGradient>
                                </View>
                            )}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewabilityConfig}
                            contentContainerStyle={styles.subscriptionScrollContainer}
                        />

                        {/* Dot Indicators */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                            {subscriptions.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === activeIndex ? styles.activeDot : {},
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Upcoming Festivals Card */}
                    <View style={styles.festivalsContainer}>
                        <View style={styles.festivalsHeader}>
                            <Text style={styles.sectionTitle}>Festival Calendar</Text>
                        </View>

                        <View style={styles.festivalsGrid}>
                            {UPCOMING_FESTIVALS.map((festival, index) => (
                                <TouchableOpacity key={festival.id} style={[styles.festivalCard, index === 1 && styles.middleCard]}>
                                    <View style={styles.festivalImageContainer}>
                                        <LinearGradient
                                            colors={festival.gradient}
                                            style={styles.festivalImageGradient}
                                        >
                                            <Text style={styles.festivalEmoji}>
                                                {festival.id === '1' ? '🌺' : festival.id === '2' ? '🪔' : '🌸'}
                                            </Text>
                                        </LinearGradient>
                                        <View style={styles.countdownBadge}>
                                            <Text style={styles.countdownNumber}>{festival.daysLeft}</Text>
                                            <Text style={styles.countdownLabel}>days</Text>
                                        </View>
                                    </View>

                                    <View style={styles.festivalInfo}>
                                        <Text style={styles.festivalName}>{festival.name}</Text>
                                        <Text style={styles.festivalDate}>{festival.date}</Text>
                                        <Text style={styles.festivalDescription} numberOfLines={2}>
                                            {festival.description}
                                        </Text>

                                        <TouchableOpacity style={styles.orderButton}>
                                            <LinearGradient
                                                colors={['#FF6B35', '#F7931E']}
                                                style={styles.orderButtonGradient}
                                            >
                                                <Text style={styles.orderButtonText}>Order Now</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Special Offers */}
                    <View style={styles.offersContainer}>
                        <View style={styles.festivalsHeader}>
                            <Text style={styles.sectionTitle}>Limited Time Offers</Text>
                        </View>
                        <View style={styles.specialOfferCard}>
                            <LinearGradient
                                colors={['#667EEA', '#764BA2', '#F093FB']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.specialOfferGradient}
                            >
                                <View style={styles.offerPattern}>
                                    <Text style={styles.patternEmoji}>✨</Text>
                                    <Text style={styles.patternEmoji}>🎊</Text>
                                    <Text style={styles.patternEmoji}>🌟</Text>
                                </View>

                                <View style={styles.offerMainContent}>
                                    <View style={styles.offerBadge}>
                                        <Text style={styles.offerBadgeText}>{offerDetails?.sub_header}</Text>
                                    </View>

                                    <Text style={styles.offerMainTitle}>🎉 {offerDetails?.main_header}</Text>
                                    <Text style={styles.offerDescription}>
                                        {offerDetails?.content}
                                    </Text>

                                    <View style={styles.offerHighlight}>
                                        <View style={styles.discountCircle}>
                                            <Text style={styles.discountPercentage}>{offerDetails?.discount}</Text>
                                            {/* <Text style={styles.discountText}>OFF</Text> */}
                                            {/* <Text style={styles.discountPercentage}>Buy 1 Get 1 Free</Text> */}
                                        </View>

                                        <View style={styles.offerInfo}>
                                            {offerDetails?.menu?.split(',').map((item, index) => (
                                                <View key={index} style={styles.offerRow}>
                                                    <View style={styles.bulletDot} />
                                                    <Text style={styles.offerInfoText}>{item.trim()}</Text>
                                                </View>
                                            ))}
                                            <View style={styles.offerRow}>
                                                <View style={styles.bulletDot} />
                                                <Text style={styles.offerInfoText}>
                                                    Valid till {new Date(offerDetails?.end_date).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.grabOfferButton}>
                                        <LinearGradient
                                            colors={['#FF6B35', '#F7931E']}
                                            style={styles.grabOfferGradient}
                                        >
                                            <Text style={styles.grabOfferText}>🎯 Grab This Offer</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const QuickAction = ({ label, icon, colors, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
        <LinearGradient colors={colors} style={styles.quickActionGradient}>
            <Icon name={icon} size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
);

export default NewHome;

// Styles (same as before, truncated for brevity — reuse your styles)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    scrollView: {
        flex: 1
    },
    header: {
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    logo: {
        width: 120,
        height: 100,
        alignSelf: 'flex-start',
    },
    menuIconContainer: {
        position: 'absolute',
        top: 35,
        right: 15,
    },
    heroSubtitle: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
        opacity: 0.95,
    },
    heroStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    statItem: { alignItems: 'center' },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.9,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#FFFFFF',
        opacity: 0.3,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: -20,
        marginBottom: 20,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#FFE5D9',
    },
    searchIcon: {
        marginRight: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
        textAlign: 'center',
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 30,
        paddingHorizontal: 10,
        // marginTop: 20,
    },
    quickAction: {
        alignItems: 'center',
        flex: 1,
    },
    quickActionGradient: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    subscriptionScrollContainer: {
        paddingHorizontal: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#8B5CF6',
        width: 20,
        height: 8,
        borderRadius: 6,
    },
    subscriptionCard: {
        marginRight: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    subscriptionGradient: {
        flex: 1,
        padding: 24,
        borderRadius: 24,
    },
    subscriptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subscriptionLeft: {
        flex: 1,
        marginRight: 16,
    },
    subscriptionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subscriptionSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 16,
        lineHeight: 20,
    },
    subscriptionPrice: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    priceText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 16,
        color: '#FFFFFF',
        textDecorationLine: 'line-through',
        opacity: 0.7,
        marginRight: 4,
    },
    priceInterval: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    subscribeButton: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignSelf: 'flex-start',
        backgroundColor: '#FF6B35',
    },
    subscribeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subscriptionImage: {
        width: 80,
        height: 80,
        borderRadius: 20,
        resizeMode: 'cover',
    },
    festivalsContainer: {
        marginVertical: 20,
    },
    festivalsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    festivalsGrid: {
        paddingHorizontal: 20,
        gap: 16,
    },
    festivalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 4,
    },
    middleCard: {
        transform: [{ scale: 1.02 }],
        shadowOpacity: 0.12,
        elevation: 8,
    },
    festivalImageContainer: {
        position: 'relative',
        marginRight: 16,
        alignItems: 'center',
    },
    festivalImageGradient: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    festivalEmoji: {
        fontSize: 32,
    },
    countdownBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF6B35',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 40,
        alignItems: 'center',
        shadowColor: '#FF6B35',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    countdownNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 14,
    },
    countdownLabel: {
        fontSize: 8,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.9,
        lineHeight: 10,
    },
    festivalInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    festivalName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    festivalDate: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 8,
    },
    festivalDescription: {
        fontSize: 13,
        color: '#9CA3AF',
        lineHeight: 18,
        marginBottom: 12,
    },
    orderButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    orderButtonGradient: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    orderButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    offersContainer: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#6366F1',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    specialOfferCard: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    specialOfferGradient: {
        padding: 28,
        position: 'relative',
    },
    offerPattern: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        opacity: 0.2,
    },
    patternEmoji: {
        fontSize: 32,
        marginHorizontal: 8,
        marginTop: 16,
    },
    offerMainContent: {
        alignItems: 'center',
    },
    offerBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    offerBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    offerMainTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    offerDescription: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 0.95,
        marginBottom: 24,
        lineHeight: 22,
    },
    offerHighlight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    discountCircle: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    discountPercentage: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        lineHeight: 28,
    },
    discountText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667EEA',
        lineHeight: 14,
    },
    offerInfo: {
        flex: 1,
    },
    offerInfoText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '600',
        marginBottom: 6,
        opacity: 0.95,
    },
    offerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6B35', // Purple or your theme color
        marginRight: 10,
        marginTop: 2,
    },
    grabOfferButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#FF6B35',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    grabOfferGradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    grabOfferText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
