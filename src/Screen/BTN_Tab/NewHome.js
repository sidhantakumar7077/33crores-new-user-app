import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Dimensions,
    FlatList,
    Share,
    Linking,
    Platform,
    ToastAndroid,
    ActivityIndicator,
    RefreshControl,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Calendar } from 'react-native-calendars';
import { base_url } from '../../../App';
import { useTab } from '../TabContext';
import Drawer from '../../component/Drawer'
import Notification from '../../component/Notification';
import moment from 'moment';
import DeviceInfo from 'react-native-device-info';

const { width } = Dimensions.get('window');

const NewHome = () => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const pulse = React.useRef(new Animated.Value(0)).current;
    const [spinner, setSpinner] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [allPackages, setAllPackages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef();
    const [offerDetails, setOfferDetails] = useState(null);
    const { setActiveTab } = useTab();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const closeModal = () => setIsModalVisible(false);
    const [referralCode, setReferralCode] = useState(null);
    const [code, setCode] = useState('');
    const [isReferCodeApply, setIsReferCodeApply] = useState('yes');
    const [referCodeSpinner, setReferCodeSpinner] = useState(false);
    // --- Festivals state ---
    const [festivals, setFestivals] = useState([]);
    const [festivalsLoading, setFestivalsLoading] = useState(false);
    const [festivalsError, setFestivalsError] = useState(null);

    // simple rotating gradients for cards
    const FESTIVAL_GRADIENTS = [
        ['#FF6B35', '#F7931E'],
        ['#60A5FA', '#3B82F6'],
        ['#34D399', '#10B981'],
        ['#F472B6', '#EC4899'],
    ];
    const pickGradient = (i) => FESTIVAL_GRADIENTS[i % FESTIVAL_GRADIENTS.length];

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(async () => {
            setRefreshing(false);
            await getAllPackages();
            await getOfferDetails();
            await getUpcomingFestivals();
            await getReferralCode();
            await getCurrentOrder();
            await getProductPackages();
            const storedStatus = await AsyncStorage.getItem('isReferCodeApply');
            const codeStatus = storedStatus ? JSON.parse(storedStatus) : null;
            setIsReferCodeApply(codeStatus);
            console.log("Refreshing Successful");
        }, 2000);
    }, []);

    const buildReferralMessage = (codeOverride = null) => {
        const androidLink = 'https://play.google.com/store/apps/details?id=com.thirtythreecroresapp&hl=en';
        const iosLink = 'https://apps.apple.com/in/app/33-crores/id6443912970';

        return (
            `🙏 Namaskar\n` +
            `I am delighted to share this new service.\n` +
            `Order Fresh Pooja Flowers from 33Crores, free home delivery.\n\n` +
            `Use my referral code ${referralCode} to get special benefits on your first flower subscription.\n\n` +
            `📱 Android: ${androidLink}\n` +
            `🍎 iOS: ${iosLink}`
        );
    };

    const handleInvite = async () => {
        try {
            await Share.share({ message: buildReferralMessage() });
        } catch (e) {
            console.log('Share error:', e);
        }
    };

    const handleWhatsAppInvite = async () => {
        const text = encodeURIComponent(buildReferralMessage());
        const url = `whatsapp://send?text=${text}`;
        const webUrl = `https://wa.me/?text=${text}`;
        try {
            const canOpen = await Linking.canOpenURL(url);
            await Linking.openURL(canOpen ? url : webUrl);
        } catch (e) {
            console.log('WhatsApp error:', e);
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

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

    // NEW: product packages carousel
    const [productPackages, setProductPackages] = useState([]);
    const pkgFlatRef = useRef();
    const [activePkgIndex, setActivePkgIndex] = useState(0);
    const onPkgViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setActivePkgIndex(viewableItems[0].index);
    }).current;
    const pkgViewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    // NEW: get product packages (category === "Package")
    const getProductPackages = async () => {
        try {
            const res = await fetch(base_url + 'api/package-items', {
                method: 'GET',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (res.ok && Array.isArray(json?.data)) {
                const pkgs = json.data.filter(
                    (it) => (it?.category || '').toLowerCase() === 'package'
                );
                setProductPackages(pkgs);
            }
        } catch (e) {
            console.error('getProductPackages error:', e);
        }
    };

    const [activeSubscription, setActiveSubscription] = useState([]);
    const [approvedRequest, setApprovedRequest] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Cancel modal state
    const [cancelRequestModalVisible, setCancelRequestModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelRequestLoading, setCancelRequestLoading] = useState(false);

    // helpers
    const openCancelOrderModal = () => {
        setCancelReason('');
        setCancelRequestModalVisible(true);
    };

    const closeCancelRequestModal = () => {
        if (!cancelRequestLoading) setCancelRequestModalVisible(false);
    };

    const cancelApprovedRequest = async () => {
        if (!approvedRequest) return;
        const requestId = approvedRequest?.request_id;
        if (!requestId) {
            // Alert.alert('Error', 'Missing request id');
            ToastAndroid.show('Missing request id', ToastAndroid.SHORT);
            return;
        }
        if (!cancelReason.trim()) {
            // Alert.alert('Reason required', 'Please enter a reason for cancellation.');
            ToastAndroid.show('Reason required', ToastAndroid.SHORT);
            return;
        }

        try {
            setCancelRequestLoading(true);
            const access_token = await AsyncStorage.getItem('storeAccesstoken');
            const res = await fetch(`${base_url}api/flower-requests/cancel/${requestId}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
                },
                body: JSON.stringify({
                    cancel_by: 'user',
                    cancel_reason: cancelReason.trim(),
                }),
            });

            const json = await res.json();
            if (res.ok || res.status === 200) {
                // success
                closeCancelRequestModal();
                // refresh lists and clear the pending bar
                console.log("Cancelled Successfully", json);
                await getCurrentOrder?.();
                setApprovedRequest(null);
                // Alert.alert('Cancelled', 'Your request has been cancelled.');
                ToastAndroid.show('Your request has been cancelled.', ToastAndroid.SHORT);
            } else {
                // Alert.alert('Error', json?.message || 'Unable to cancel the order');
                ToastAndroid.show(json?.message || 'Unable to cancel the order', ToastAndroid.SHORT);
            }
        } catch (e) {
            ToastAndroid.show(e?.message || 'Something went wrong', ToastAndroid.SHORT);
        } finally {
            setCancelRequestLoading(false);
        }
    };

    const getCurrentOrder = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');

        await fetch(base_url + 'api/orders-list', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token
            },
        }).then(response => response.json()).then(response => {
            if (response.success) {
                // console.log("object", response.data);
                // setRequested_orderList(response.data.requested_orders);
                // setSubscriptionList(response.data.subscriptions_order);
                const subs = Array.isArray(response?.data?.subscriptions_order)
                    ? response.data.subscriptions_order
                    : [];

                // filter all active or paused subscriptions
                const activeOrPausedSubs = subs.filter(
                    s =>
                        (s?.status || '').toLowerCase() === 'active' ||
                        (s?.status || '').toLowerCase() === 'paused'
                );

                setActiveSubscription(activeOrPausedSubs);

                const reqs = Array.isArray(response?.data?.requested_orders)
                    ? response.data.requested_orders
                    : [];
                // first request with status 'approved'
                const approved = reqs.find(r => (r?.status || '').toLowerCase() === 'approved') || null;
                setApprovedRequest(approved);
            } else {
                console.error('Failed to fetch packages:', response.message);
            }
        }).catch((error) => {
            console.error('Error:', error);
        });
    };

    // Handle changes to the referral code input
    const handleChangeCode = (txt) => {
        const sanitized = txt.replace(/[^a-zA-Z0-9]/g, '');
        // guard to avoid pointless state updates on some keyboards
        if (sanitized !== code) setCode(sanitized);
    };

    const claimReferralCode = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        setReferCodeSpinner(true);

        if (code.trim() === '') {
            ToastAndroid.show("Please enter a referral code", ToastAndroid.SHORT);
            setReferCodeSpinner(false);
            return;
        }

        const res = await fetch(`${base_url}api/referrals/claim`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`
            },
            body: JSON.stringify({ referral_code: code }),
        });

        // Try to parse response (even on non-2xx)
        let data = {};
        try { data = await res.json(); } catch (_) { }

        // Normalize success check (handle either HTTP 2xx or API {success:200}/{status:200})
        const ok = res.ok || data?.success === true;

        if (ok) {
            // Handle successful referral code claim
            console.log("Referral code claimed successfully:", data);
            ToastAndroid.show("Referral code claimed successfully", ToastAndroid.SHORT);
            setCode('');
            setReferCodeSpinner(false);
            setIsReferCodeApply('yes');
            await AsyncStorage.setItem('isReferCodeApply', JSON.stringify('yes'));
        } else {
            // Handle failed referral code claim
            const msg = data?.message || 'Invalid or expired referral code.';
            ToastAndroid.show(msg, ToastAndroid.SHORT);
            setReferCodeSpinner(false);
        }
    };

    const getUpcomingFestivals = async () => {
        setFestivalsLoading(true);
        setFestivalsError(null);

        try {
            const res = await fetch(base_url + 'api/festivals', {
                method: 'GET',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            });
            const json = await res.json();

            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to load festivals');
            }

            const today = moment().startOf('day');

            const normalized = (json.data || []).map((f, idx) => {
                const m = moment(f.festival_date, 'YYYY-MM-DD', true);
                const diff = m.isValid() ? m.diff(today, 'days') : null; // negative = past
                const isOutdated = diff !== null && diff < 0;

                let status = 'unknown';
                if (m.isValid()) {
                    if (diff < 0) status = 'past';
                    else if (diff === 0) status = 'today';
                    else status = 'upcoming';
                }

                return {
                    id: String(f.id),
                    name: f.festival_name,
                    date: m.isValid() ? m.format('DD MMM YYYY') : f.festival_date,
                    rawDate: f.festival_date,
                    daysLeft: diff,          // can be negative for past
                    isOutdated,              // ✅ flag for expired
                    status,                  // 'past' | 'today' | 'upcoming'
                    description: f.description || '',
                    gradient: pickGradient(idx),
                    packages: f.packages || [],
                    package_price: f.package_price,
                    related_flower: f.related_flower,
                    festival_image: f.festival_image,
                };
            })
                // sort by actual date ascending
                .sort((a, b) => moment(a.rawDate).diff(moment(b.rawDate)));

            // If you only want to show Today/Upcoming in the UI:
            const upcomingOrToday = normalized.filter(it => !it.isOutdated);
            const expired = normalized.filter(it => it.isOutdated);

            setFestivals(upcomingOrToday);
        } catch (e) {
            setFestivalsError(String(e.message || e));
        } finally {
            setFestivalsLoading(false);
        }
    };

    const getReferralCode = async () => {
        try {
            const raw = await AsyncStorage.getItem('userData');
            const user = raw ? JSON.parse(raw) : null;
            const code = user?.referral_code ?? null;
            setReferralCode(code);
        } catch (e) {
            console.log("Error reading referral code:", e);
            setReferralCode(null);
        }
    };

    const copyCode = () => {
        if (!referralCode) {
            ToastAndroid.show('No referral code found', ToastAndroid.SHORT);
            return;
        }
        Clipboard.setString(referralCode);
        ToastAndroid.show('Referral code copied', ToastAndroid.SHORT);
    };

    // Last login and version check
    const postLastLoginAndVersion = async () => {
        try {
            // Current timestamp
            const nowIso = new Date().toISOString();
            const lastLogin = moment(nowIso).format('YYYY-MM-DD HH:mm:ss');

            // Device/App info
            const version = DeviceInfo.getVersion();
            const model = DeviceInfo.getModel();
            const os_name = DeviceInfo.getSystemName();

            // Auth token from storage
            const token = await AsyncStorage.getItem('storeAccesstoken');

            // Build payload
            const payload = {
                last_login_at: lastLogin,
                version: version,
                model: model,
                os_name: os_name
            };

            // console.log('Posting last login and version info:', payload);

            // POST request
            const response = await fetch(`${base_url}api/update-device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            // Parse response
            const data = await response.json();
            if (response.ok) {
                // console.log('Server response:', data);
                return data;
            } else {
                // console.log('Failed:', data.message || 'Unknown error');
                return null;
            }
        } catch (error) {
            // console.log('Error posting last login info:', error);
            return null;
        }
    };

    useEffect(() => {
        if (isFocused) {
            const fetchData = async () => {
                await getAllPackages();
                await getOfferDetails();
                await getUpcomingFestivals();
                await getReferralCode();
                await getCurrentOrder();
                await getProductPackages();
                await postLastLoginAndVersion();

                try {
                    const storedStatus = await AsyncStorage.getItem('isReferCodeApply');
                    const codeStatus = storedStatus ? JSON.parse(storedStatus) : null;
                    setIsReferCodeApply(codeStatus);
                    console.log("Referral code status:", codeStatus);
                } catch (err) {
                    console.error('Error reading referral code status', err);
                }
            };

            fetchData();
        }
    }, [isFocused]);

    // highlight pulse
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    // Pause range
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
    const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
    useEffect(() => { if (endDate < startDate) setEndDate(startDate); }, [startDate, endDate]);

    // Pause modal
    const [isPauseModalVisible, setPauseModalVisible] = useState(false);
    const openPauseModal = () => setPauseModalVisible(true);
    const closePauseModal = () => setPauseModalVisible(false);
    const [selectedPackageId, setSelectedPackageId] = useState(null);
    const [isPausedEdit, setIsPausedEdit] = useState('no'); // "no" | "yes"
    const [selectedPauseLogId, setSelectedPauseLogId] = useState(null);

    // Date pickers for pause
    const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
    const openStartDatePicker = () => setIsStartDateModalOpen(true);
    const closeStartDatePicker = () => setIsStartDateModalOpen(false);

    const [isEndDateModalOpen, setIsEndDateModalOpen] = useState(false);
    const openEndDatePicker = () => setIsEndDateModalOpen(true);
    const closeEndDatePicker = () => setIsEndDateModalOpen(false);

    // Resume flow
    const [isResumeModalVisible, setResumeModalVisible] = useState(false);
    const openResumeModal = () => setResumeModalVisible(true);
    const closeResumeModal = () => setResumeModalVisible(false);
    const [selectedResumePackageId, setSelectedResumePackageId] = useState(null);

    const [resumeDate, setResumeDate] = useState(null);
    const [pause_start_date, setPause_start_date] = useState(null); // bounds for resume
    const [pause_end_date, setPause_end_date] = useState(null);

    const [isResumeDateModalOpen, setIsResumeDateModalOpen] = useState(false);
    const openResumeDatePicker = () => setIsResumeDateModalOpen(true);
    const closeResumeDatePicker = () => setIsResumeDateModalOpen(false);

    // Cancel-pause confirm modal
    const [isCancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelTargetId, setCancelTargetId] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Trigger Pause (from card buttons)
    const handlePauseButton = (order_id) => {
        setSelectedPackageId(order_id);
        openPauseModal();
    };

    // Pickers
    const handleStartDatePress = (day) => { setStartDate(new Date(day.dateString)); closeStartDatePicker(); };
    const handleEndDatePress = (day) => { setEndDate(new Date(day.dateString)); closeEndDatePicker(); };

    // Submit Pause / Edit-Pause
    const submitPauseDates = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        try {
            const response = await fetch(`${base_url}api/subscription/pause/${selectedPackageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
                body: JSON.stringify({
                    pause_start_date: moment(startDate).format('YYYY-MM-DD'),
                    pause_end_date: moment(endDate).format('YYYY-MM-DD'),
                    edit: isPausedEdit,
                    pause_log_id: selectedPauseLogId
                }),
            });
            const data = await response.json();
            if (response.status === 200) {
                closePauseModal();
                getCurrentOrder(); // refresh list if you already have this function
            } else {
                Alert.alert('Error', data?.message || 'Unable to pause');
            }
        } catch (e) {
            Alert.alert('Error', 'Something went wrong');
        }
    };

    // Resume button on card
    const handleResumeButton = (item) => {
        setSelectedResumePackageId(item.order_id);
        setPause_start_date(item.pause_start_date);
        setPause_end_date(item.pause_end_date);
        // Default resumeDate = max(today+1, pause_start_date)
        if (item.pause_start_date) {
            const today = new Date();
            const psd = new Date(item.pause_start_date);
            setResumeDate(today > psd ? new Date(today.setDate(today.getDate() + 1)) : psd);
        } else {
            setResumeDate(new Date());
        }
        openResumeModal();
    };

    const handleResumDatePress = (day) => { setResumeDate(new Date(day.dateString)); closeResumeDatePicker(); };

    const submitResumeDates = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        try {
            const response = await fetch(`${base_url}api/subscription/resume/${selectedResumePackageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
                body: JSON.stringify({ resume_date: moment(resumeDate).format('YYYY-MM-DD') }),
            });
            const data = await response.json();
            if (response.status === 200) {
                closeResumeModal();
                getCurrentOrder();
            } else {
                Alert.alert('Error', data?.message || 'Unable to resume');
            }
        } catch (e) {
            Alert.alert('Error', 'Something went wrong');
        }
    };

    // Cancel scheduled pause
    const openCancelModal = (orderId) => { setCancelTargetId(orderId); setCancelModalVisible(true); };
    const closeCancelModal = () => { if (!cancelLoading) { setCancelModalVisible(false); setCancelTargetId(null); } };

    const cancelScheduledPause = async (orderId) => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        try {
            setCancelLoading(true);
            const response = await fetch(`${base_url}api/subscriptions/delete-pause/${orderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
            });
            const data = await response.json();
            if (response.status === 200) {
                getCurrentOrder();
                closeCancelModal();
            } else {
                Alert.alert('Error', data?.message || 'Unable to cancel the scheduled pause');
            }
        } catch (e) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleRenewal = (item) => {
        // console.log("Renewal for:", item);
        navigation.navigate('SubscriptionCheckoutPage', {
            flowerData: item?.flower_products,
            order_id: item?.order_id,                          // <-- pass existing order_id
            preEndDate: item?.new_date || item?.end_date || null, // <-- last active day
        });
    };

    return (
        <View style={styles.container}>
            <Notification />
            <Drawer visible={isModalVisible} navigation={navigation} onClose={closeModal} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
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

                    {/* Quick Actions */}
                    <View style={styles.quickActionsContainer}>
                        <QuickAction
                            label="Custom Order"
                            icon="clock"
                            colors={['#8B5CF6', '#A855F7']}
                            onPress={() => navigation.navigate('CustomOrderScreen')}
                        />
                        <QuickAction label="Subscribe" icon="calendar" colors={['#10B981', '#059669']} onPress={() => setActiveTab('subscribe')} />
                        <QuickAction label="Rewards" icon="gift" colors={['#0b7cf5ff', '#539be8ff']} onPress={() => navigation.navigate('ReferralPage')} />
                        <QuickAction label="My Orders" icon="truck" colors={['#EF4444', '#DC2626']} onPress={() => navigation.navigate('MyOrder')} />
                    </View>
                    {spinner ?
                        <ActivityIndicator size="large" color="#f18204ff" />
                        :
                        <>
                            {/* Enter Referral Code */}
                            {isReferCodeApply === 'no' && (
                                <LinearGradient colors={['#FFEDD5', '#FDBA74']} style={styles.card}>
                                    <View style={styles.headerRow}>
                                        <Icon name="gift" size={18} color="#9A3412" />
                                        <Text style={styles.title}>Have a Referral Code?</Text>
                                    </View>

                                    <Text style={styles.subtitle}>
                                        Enter your code to unlock rewards on your first Subscription.
                                    </Text>

                                    <View style={styles.row}>
                                        <View style={styles.inputRow}>
                                            <Icon name="ticket-alt" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter Code"
                                                placeholderTextColor="#9CA3AF"
                                                value={code}
                                                onChangeText={handleChangeCode}
                                                autoCapitalize="characters"
                                                autoCorrect={false}
                                                autoComplete="off"
                                            />
                                        </View>

                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => claimReferralCode()}
                                            style={styles.applyBtn}
                                        >
                                            <LinearGradient colors={['#FF6B35', '#F97316']} style={styles.applyGrad}>
                                                {referCodeSpinner ?
                                                    <ActivityIndicator size="small" color="#fff" />
                                                    :
                                                    <Text style={styles.applyText}>Apply</Text>
                                                }
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            )}

                            {/* Active Subscription — Attractive Highlight */}
                            {Array.isArray(activeSubscription) && activeSubscription.length > 0 && (
                                <>
                                    <FlatList
                                        data={activeSubscription}
                                        keyExtractor={(item, idx) => String(item?.order_id ?? idx)}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        snapToAlignment="center"
                                        decelerationRate="fast"
                                        renderItem={({ item }) => {
                                            // ---- per-item derived values ----
                                            const subStatus = String(item?.status || '').toLowerCase();

                                            const dur = Number(item?.flower_products?.duration);
                                            const totalDays = ({ 1: 30, 3: 90, 6: 180 }[dur]) ?? 0;

                                            const start = moment(item?.start_date, 'YYYY-MM-DD');
                                            const end = moment(item?.new_date || item?.end_date, 'YYYY-MM-DD');
                                            const today = moment().startOf('day');
                                            const until = end.isValid() ? moment.min(today, end) : today;

                                            const usedDays = start.isValid()
                                                ? Math.min(totalDays, Math.max(0, until.diff(start, 'days') + 1))
                                                : 0;

                                            const remainingDays = Math.max(0, totalDays - usedDays);
                                            const progressPct = totalDays ? Math.round((usedDays / totalDays) * 100) : 0;

                                            // flags
                                            const showPause = subStatus === 'active';
                                            const showResume = subStatus === 'paused';
                                            const showEditPause = subStatus === 'active' && !!item?.pause_start_date;
                                            const isScheduledPause =
                                                subStatus === 'active' &&
                                                item?.pause_start_date &&
                                                new Date(item.pause_start_date) > new Date();
                                            const hasPendingRenewal = item?.pending_renewals && Object.keys(item.pending_renewals).length > 0;

                                            return (
                                                <View style={{ width }}>
                                                    <View style={styles.subCardNew}>
                                                        {/* Gradient hero band */}
                                                        <LinearGradient
                                                            colors={subStatus === 'active' ? ['#F59E0B', '#F97316'] : ['#CBD5E1', '#94A3B8']}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 1 }}
                                                            style={styles.subHero}
                                                        >
                                                            <View style={styles.subHeroLeft}>
                                                                <View style={styles.subHeroIcon}>
                                                                    <Icon name="leaf" size={14} color="#065F46" />
                                                                </View>
                                                                <View>
                                                                    <Text style={styles.subHeroTitle} numberOfLines={1}>
                                                                        {item?.flower_products?.name || 'Subscription'}
                                                                    </Text>
                                                                    <Text style={styles.subHeroMeta}>
                                                                        {`${moment(item?.start_date).format('DD MMM YYYY')} → ${moment(
                                                                            item?.new_date || item?.end_date
                                                                        ).format('DD MMM YYYY')}`}
                                                                    </Text>
                                                                </View>
                                                            </View>

                                                            <View
                                                                style={[
                                                                    styles.subStatusChip,
                                                                    subStatus === 'active' ? styles.subChipActive : styles.subChipPaused,
                                                                ]}
                                                            >
                                                                <Text style={styles.subStatusText}>{(item?.status || '').toUpperCase()}</Text>
                                                            </View>
                                                        </LinearGradient>

                                                        {/* Progress + stats */}
                                                        <View style={styles.subBody}>
                                                            <View style={styles.progressRow}>
                                                                <View style={styles.progressTrack}>
                                                                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                                                                </View>
                                                                <Text style={styles.progressPct}>{progressPct}%</Text>
                                                            </View>

                                                            <View style={styles.statsRow}>
                                                                <View style={styles.statBadge}>
                                                                    <Icon name="calendar-day" size={10} color="#0F172A" />
                                                                    <Text style={styles.statText}>Total {totalDays}d</Text>
                                                                </View>
                                                                <View style={styles.statBadge}>
                                                                    <Icon name="check-circle" size={10} color="#0F172A" />
                                                                    <Text style={styles.statText}>Used {usedDays}d</Text>
                                                                </View>
                                                                <View style={[styles.statBadge, styles.statBadgeEm]}>
                                                                    <Icon name="hourglass-half" size={10} color="#065F46" />
                                                                    <Text style={[styles.statText, { color: '#065F46' }]}>Left {remainingDays}d</Text>
                                                                </View>
                                                            </View>

                                                            {/* Actions */}
                                                            <View style={styles.actionsRow}>
                                                                <TouchableOpacity
                                                                    style={styles.outlineBtn}
                                                                    onPress={() => navigation.navigate('SubscriptionOrderDetailsPage', item)}
                                                                >
                                                                    <Text style={styles.outlineText}>View Details</Text>
                                                                </TouchableOpacity>

                                                                {showPause && !showEditPause && (
                                                                    <TouchableOpacity
                                                                        style={styles.actionGradBtn}
                                                                        onPress={() => {
                                                                            handlePauseButton(item?.order_id);
                                                                            setIsPausedEdit('no');
                                                                            setSelectedPauseLogId(null);
                                                                        }}
                                                                    >
                                                                        <LinearGradient colors={['#16A34A', '#10B981']} style={styles.gradInner}>
                                                                            <Icon name="pause" size={12} color="#fff" />
                                                                            <Text style={styles.gradText}>Pause</Text>
                                                                        </LinearGradient>
                                                                    </TouchableOpacity>
                                                                )}

                                                                {showEditPause && (
                                                                    <TouchableOpacity
                                                                        style={styles.actionGradBtn}
                                                                        onPress={() => {
                                                                            handlePauseButton(item?.order_id);
                                                                            setIsPausedEdit('yes');
                                                                            const logs = item?.pause_resume_log;
                                                                            if (logs && logs.length > 0) {
                                                                                setSelectedPauseLogId(logs[logs.length - 1]?.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.gradInner}>
                                                                            <Icon name="edit" size={12} color="#fff" />
                                                                            <Text style={styles.gradText}>Edit Pause</Text>
                                                                        </LinearGradient>
                                                                    </TouchableOpacity>
                                                                )}

                                                                {isScheduledPause && (
                                                                    <TouchableOpacity
                                                                        style={styles.actionGradBtn}
                                                                        onPress={() => openCancelModal(item?.order_id)}
                                                                    >
                                                                        <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.gradInner}>
                                                                            <Icon name="times" size={12} color="#fff" />
                                                                            <Text style={styles.gradText}>Cancel Pause</Text>
                                                                        </LinearGradient>
                                                                    </TouchableOpacity>
                                                                )}

                                                                {showResume && (
                                                                    <TouchableOpacity
                                                                        style={styles.actionGradBtn}
                                                                        onPress={() => handleResumeButton(item)}
                                                                    >
                                                                        <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.gradInner}>
                                                                            <Icon name="play" size={12} color="#fff" />
                                                                            <Text style={styles.gradText}>Resume</Text>
                                                                        </LinearGradient>
                                                                    </TouchableOpacity>
                                                                )}
                                                            </View>

                                                            {remainingDays <= 5 && !hasPendingRenewal && (
                                                                <View style={styles.renewWrap}>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.92}
                                                                        style={styles.renewBtnOuter}
                                                                        onPress={() => handleRenewal(item)}
                                                                    >
                                                                        <LinearGradient
                                                                            colors={['#3B82F6', '#2563EB']}
                                                                            start={{ x: 0, y: 0 }}
                                                                            end={{ x: 1, y: 1 }}
                                                                            style={styles.renewGradFull}
                                                                        >
                                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                                                <Icon name="redo" size={16} color="#fff" />
                                                                                <Text style={styles.renewTitle}>Renew Subscription</Text>
                                                                            </View>

                                                                            <View style={styles.renewPill}>
                                                                                <Text style={styles.renewPillText}>
                                                                                    {remainingDays > 0 ? `${remainingDays} day${remainingDays === 1 ? '' : 's'} left` : 'Ends today'}
                                                                                </Text>
                                                                            </View>
                                                                        </LinearGradient>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            )}

                                                            {remainingDays <= 5 && hasPendingRenewal && (
                                                                <View style={styles.renewPendingPill}>
                                                                    <Icon name="clock" size={12} color="#92400E" style={{ marginRight: 6 }} />
                                                                    <Text style={styles.renewPendingText}>Renewal scheduled</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        }}
                                        onScroll={e => {
                                            const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                                            setCurrentIndex(slideIndex);
                                        }}
                                        scrollEventThrottle={16}
                                    />
                                    {/* Slider dots */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                                        {activeSubscription.map((_, idx) => (
                                            <View
                                                key={idx}
                                                style={{
                                                    width: currentIndex === idx ? 15 : 8,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    marginHorizontal: 4,
                                                    backgroundColor: currentIndex === idx ? '#F97316' : '#D1D5DB',
                                                }}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Premium Subscription Card — only when no active/paused subs */}
                            {(!Array.isArray(activeSubscription) || activeSubscription.length === 0) && Array.isArray(allPackages) && allPackages.length > 0 && (
                                <View style={{ marginBottom: 18 }}>
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
                                                <LinearGradient colors={['#f18204ff', '#e89a42ff', '#e9b476ff']} style={styles.subscriptionGradient}>
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
                                                                onPress={() => navigation.navigate('SubscriptionCheckoutPage', { flowerData: item, order_id: "", preEndData: null })}
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
                                        {allPackages.map((_, index) => (
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
                            )}

                            {/* Refer & Earn */}
                            <View style={styles.referralWrap}>
                                <LinearGradient
                                    colors={['#FFEDD5', '#FED7AA', '#FDBA74']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.referralCard}
                                >
                                    <View style={styles.refHeaderRow}>
                                        <View style={styles.refBadge}>
                                            <Icon name="gift" size={12} color="#fff" />
                                            <Text style={styles.refBadgeText}>Refer & Earn</Text>
                                        </View>
                                        {/* <Icon name="hands-helping" size={18} color="#9A3412" /> */}
                                        <TouchableOpacity style={styles.seeStatus} onPress={() => navigation.navigate('ReferralPage')}>
                                            <Text style={{ color: '#9A3412', fontWeight: '600' }}>See status</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.refTitle}>Invite friends, earn rewards!</Text>
                                    <Text style={styles.refSubtitle}>
                                        Share your code and they’ll get a welcome benefit on their first puja order.
                                    </Text>

                                    <View style={styles.codeRow}>
                                        <Text style={styles.codeLabel}>Your Code</Text>
                                        <View style={styles.codePill}>
                                            <Text style={styles.codeText}>{referralCode ?? '—'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
                                            <Icon name="copy" size={12} color="#0f172a" />
                                            <Text style={styles.copyText}>Copy</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.refActions}>
                                        <TouchableOpacity style={styles.inviteBtn} activeOpacity={0.9} onPress={handleInvite}>
                                            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.inviteGrad}>
                                                <Icon name="share-alt" size={14} color="#fff" style={{ marginRight: 8 }} />
                                                <Text style={styles.inviteText}>Invite</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.whatsBtn} activeOpacity={0.9} onPress={handleWhatsAppInvite}>
                                            <Icon name="whatsapp" size={16} color="#16A34A" style={{ marginRight: 8 }} />
                                            <Text style={styles.whatsText}>WhatsApp</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* Upcoming Festivals Card */}
                            <View style={styles.festivalsContainer}>
                                <View style={styles.festivalsHeader}>
                                    <Text style={styles.sectionTitle}>Upcoming Festivals</Text>
                                </View>

                                {festivalsLoading && (
                                    <ActivityIndicator size="small" color="#c9170a" style={{ marginTop: 8 }} />
                                )}

                                {!festivalsLoading && festivalsError && (
                                    <Text style={{ color: '#ef4444', marginTop: 8 }}>
                                        {String(festivalsError)}
                                    </Text>
                                )}

                                {!festivalsLoading && !festivalsError && festivals.length === 0 && (
                                    <Text style={{ color: '#64748b', marginTop: 8 }}>
                                        No upcoming festivals.
                                    </Text>
                                )}

                                {!festivalsLoading && !festivalsError && festivals.length > 0 && (
                                    <View style={styles.festivalsGrid}>
                                        {festivals.map((festival, index) => (
                                            <TouchableOpacity
                                                key={festival.id}
                                                style={[styles.festivalCard, index === 1 && styles.middleCard]}
                                            >
                                                <View style={styles.festivalImageContainer}>
                                                    <LinearGradient
                                                        colors={festival.gradient}
                                                        style={styles.festivalImageGradient}
                                                    >
                                                        <Text style={styles.festivalEmoji}>
                                                            {/* {index === 0 ? '🌺' : index === 1 ? '🪔' : '🌸'} */}
                                                            {festival.festival_image ?
                                                                <Image
                                                                    source={{ uri: festival.festival_image }}
                                                                    style={{ width: 65, height: 65 }}
                                                                    resizeMode="contain"
                                                                />
                                                                :
                                                                '🪔'
                                                            }
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
                                                    {/* <TouchableOpacity style={styles.orderButton}>
                                                <LinearGradient
                                                    colors={['#FF6B35', '#F7931E']}
                                                    style={styles.orderButtonGradient}
                                                >
                                                    <Text style={styles.orderButtonText}>Order Now</Text>
                                                </LinearGradient>
                                            </TouchableOpacity> */}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Product Packages (like flower subscription) */}
                            {productPackages.length > 0 && (
                                <View style={{ marginTop: 10, marginBottom: approvedRequest ? 80 : 10 }}>
                                    <View style={styles.festivalsHeader}>
                                        <Text style={styles.sectionTitle}>Puja Packages</Text>
                                    </View>

                                    <FlatList
                                        ref={pkgFlatRef}
                                        data={productPackages}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        decelerationRate="fast"
                                        snapToAlignment="center"
                                        keyExtractor={(item) => String(item.product_id)}
                                        renderItem={({ item }) => (
                                            <View style={[styles.subscriptionCard, { width: width - 40 }]}>
                                                {/* different gradient to distinguish from subscription */}
                                                <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.subscriptionGradient}>
                                                    <View style={styles.subscriptionContent}>
                                                        <View style={styles.subscriptionLeft}>
                                                            <Text style={styles.subscriptionTitle} numberOfLines={2}>{item.name}</Text>
                                                            <Text style={styles.subscriptionSubtitle} numberOfLines={2}>{item.description}</Text>

                                                            <View style={styles.subscriptionPrice}>
                                                                <Text style={styles.priceText}>₹ {item.price}</Text>
                                                                {!!item.mrp && <Text style={styles.originalPrice}>₹ {item.mrp}</Text>}
                                                                {!!item.duration && (
                                                                    <Text style={styles.priceInterval}>/ {item.duration} {item.duration > 1 ? 'months' : 'month'}</Text>
                                                                )}
                                                            </View>

                                                            <TouchableOpacity
                                                                style={styles.subscribeButton}
                                                                onPress={() => navigation.navigate('ProductCheckoutPage', item)}
                                                            >
                                                                <Text style={styles.subscribeButtonText}>Buy Package</Text>
                                                            </TouchableOpacity>
                                                        </View>

                                                        {!!item.product_image && (
                                                            <Image source={{ uri: item.product_image }} style={styles.subscriptionImage} />
                                                        )}
                                                    </View>
                                                </LinearGradient>
                                            </View>
                                        )}
                                        onViewableItemsChanged={onPkgViewableItemsChanged}
                                        viewabilityConfig={pkgViewabilityConfig}
                                        contentContainerStyle={styles.subscriptionScrollContainer}
                                    />

                                    {/* Dot Indicators for packages */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                                        {productPackages.map((pkg, index) => (
                                            <View
                                                key={pkg.product_id}
                                                style={[styles.dot, index === activePkgIndex ? styles.activeDot : null]}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Special Offers */}
                            {/* <View style={styles.offersContainer}>
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
                                                    <Text style={styles.grabOfferText}>🎯 Offer Active soon</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </View> */}
                        </>
                    }
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Pending payment fixed bottom bar */}
            {approvedRequest && (
                <Animated.View
                    pointerEvents="box-none"
                    style={[
                        styles.pendingBarWrap,
                        {
                            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
                            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }),
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#F59E0B', '#F97316']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pendingBar}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pendingTitle}>Pending Payment</Text>
                            <Text style={styles.pendingMeta} numberOfLines={1}>
                                {(approvedRequest?.flower_product?.name ||
                                    approvedRequest?.flower_products?.name ||
                                    'Custom Order')}{' '}
                                • {approvedRequest?.date ? moment(approvedRequest.date).format('DD MMM YYYY') : ''}{' '}
                                {approvedRequest?.time ? `• ${approvedRequest.time}` : ''}
                            </Text>
                        </View>

                        {!!(approvedRequest?.order?.total_price || approvedRequest?.order?.requested_flower_price) && (
                            <Text style={styles.pendingPrice}>
                                ₹ {approvedRequest?.order?.total_price ?? approvedRequest?.order?.requested_flower_price}
                            </Text>
                        )}

                        {/* NEW: Cancel + Pay buttons */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(255,255,255,0.9)',
                                    backgroundColor: 'transparent',
                                }}
                                onPress={openCancelOrderModal}
                                activeOpacity={0.9}
                            >
                                <Text style={{ color: '#fff', fontWeight: '900' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.payBtn}
                                onPress={() => navigation.navigate('CustomOrderDetailsPage', approvedRequest)}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.payBtnText}>Pay</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>
            )}

            {/* Pause modal */}
            <Modal animationType="slide" transparent visible={isPauseModalVisible} onRequestClose={closePauseModal}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                        <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={closePauseModal}>
                            <Feather name="x" color="#000" size={26} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 6 }}>Pause Start Date</Text>
                        <TouchableOpacity onPress={openStartDatePicker}>
                            <TextInput style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1', marginBottom: 10, color: '#0f172a', paddingVertical: 6, fontWeight: '700' }} value={moment(startDate).format('DD MMM YYYY')} editable={false} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 6 }}>Pause End Date</Text>
                        <TouchableOpacity onPress={openEndDatePicker}>
                            <TextInput style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1', marginBottom: 10, color: '#0f172a', paddingVertical: 6, fontWeight: '700' }} value={moment(endDate).format('DD MMM YYYY')} editable={false} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={submitPauseDates}>
                            <LinearGradient colors={['#FF6B35', '#F7931E']} style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', alignItems: 'center', paddingVertical: 12 }}>
                                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Submit</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Start date picker */}
            <Modal animationType="slide" transparent visible={isStartDateModalOpen} onRequestClose={closeStartDatePicker}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
                        <Calendar
                            onDayPress={handleStartDatePress}
                            markedDates={{ [moment(startDate).format('YYYY-MM-DD')]: { selected: true, marked: true, selectedColor: 'blue' } }}
                            minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
                        />
                    </View>
                </View>
            </Modal>

            {/* End date picker */}
            <Modal animationType="slide" transparent visible={isEndDateModalOpen} onRequestClose={closeEndDatePicker}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
                        <Calendar
                            onDayPress={handleEndDatePress}
                            markedDates={{ [moment(endDate).format('YYYY-MM-DD')]: { selected: true, marked: true, selectedColor: 'blue' } }}
                            minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
                        />
                    </View>
                </View>
            </Modal>

            {/* Cancel Pause confirm modal */}
            <Modal animationType="slide" transparent visible={isCancelModalVisible} onRequestClose={closeCancelModal}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={!cancelLoading ? closeCancelModal : undefined} />
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
                        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
                        <LinearGradient colors={['#fb7185', '#ef4444']} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Feather name="pause-circle" size={26} color="#fff" />
                        </LinearGradient>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Cancel scheduled pause?</Text>
                        <Text style={{ marginTop: 6, color: '#374151', lineHeight: 20, fontWeight: '600' }}>
                            This will remove the upcoming pause for this subscription. You can schedule a new pause later.
                        </Text>
                        {!!cancelTargetId && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 12 }}>
                                <Feather name="hash" size={16} color="#6B7280" />
                                <Text style={{ color: '#374151', fontWeight: '700' }}>Order ID: {cancelTargetId}</Text>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                            <TouchableOpacity
                                style={{ flex: 1, borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                                onPress={closeCancelModal}
                                disabled={cancelLoading}
                            >
                                <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }}>No, keep pause</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12, backgroundColor: '#ef4444' }}
                                onPress={() => cancelScheduledPause(cancelTargetId)}
                                disabled={cancelLoading}
                            >
                                {cancelLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Yes, cancel</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Resume modal */}
            <Modal animationType="slide" transparent visible={isResumeModalVisible} onRequestClose={closeResumeModal}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                        <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={closeResumeModal}>
                            <Feather name="x" color="#000" size={26} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 6 }}>Resume Date</Text>
                        <TouchableOpacity onPress={openResumeDatePicker}>
                            <Text style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1', marginBottom: 10, color: '#0f172a', paddingVertical: 10, fontWeight: '700' }}>
                                {resumeDate ? moment(resumeDate).format('DD MMM YYYY') : 'Select a date'}
                            </Text>
                        </TouchableOpacity>
                        {!resumeDate && <Text style={{ color: 'red', marginBottom: 8 }}>Please select a resume date</Text>}

                        <TouchableOpacity onPress={submitResumeDates}>
                            <LinearGradient colors={['#FF6B35', '#F7931E']} style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', alignItems: 'center', paddingVertical: 12 }}>
                                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Submit</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Resume date picker (bounded by pause range) */}
            <Modal animationType="slide" transparent visible={isResumeDateModalOpen} onRequestClose={closeResumeDatePicker}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
                        <Calendar
                            onDayPress={handleResumDatePress}
                            markedDates={{ [moment(resumeDate || pause_start_date).format('YYYY-MM-DD')]: { selected: true, marked: true, selectedColor: 'blue' } }}
                            minDate={moment().add(1, 'day').format('YYYY-MM-DD')}
                            maxDate={moment(pause_end_date).format('YYYY-MM-DD')}
                        />
                    </View>
                </View>
            </Modal>

            {/* Cancel Custome Oreder */}
            <Modal
                animationType="slide"
                transparent
                visible={cancelRequestModalVisible}
                onRequestClose={closeCancelRequestModal}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    {/* backdrop */}
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                        activeOpacity={1}
                        onPress={!cancelRequestLoading ? closeCancelRequestModal : undefined}
                    />

                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingHorizontal: 18,
                            paddingTop: 10,
                            paddingBottom: 18,
                            borderTopWidth: 1,
                            borderColor: '#E5E7EB',
                        }}
                    >
                        {/* handle bar */}
                        <View
                            style={{
                                alignSelf: 'center',
                                width: 40,
                                height: 4,
                                borderRadius: 999,
                                backgroundColor: '#E5E7EB',
                                marginBottom: 12,
                            }}
                        />

                        {/* icon */}
                        <LinearGradient
                            colors={['#fb7185', '#ef4444']}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <Feather name="x-circle" size={26} color="#fff" />
                        </LinearGradient>

                        {/* title + desc */}
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
                            Cancel this order?
                        </Text>
                        <Text style={{ marginTop: 6, color: '#374151', lineHeight: 20, fontWeight: '600' }}>
                            Please share a reason for cancelling. This helps us improve.
                        </Text>

                        {/* Request ID pill */}
                        {!!approvedRequest?.request_id && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 12 }}>
                                <Icon name="hashtag" size={12} color="#6B7280" />
                                <Text style={{ color: '#374151', fontWeight: '700' }}>Request ID: {approvedRequest.request_id}</Text>
                            </View>
                        )}

                        {/* reason input */}
                        <View
                            style={{
                                marginTop: 12,
                                borderWidth: 1,
                                borderColor: '#CBD5E1',
                                borderRadius: 10,
                                backgroundColor: '#F9FAFB',
                            }}
                        >
                            <TextInput
                                style={{
                                    minHeight: 90,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    color: '#0f172a',
                                }}
                                placeholder="Type your reason..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                editable={!cancelRequestLoading}
                            />
                        </View>

                        {/* action buttons */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    borderWidth: 1.5,
                                    borderColor: '#CBD5E1',
                                    backgroundColor: '#fff',
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                }}
                                onPress={closeCancelRequestModal}
                                disabled={cancelRequestLoading}
                            >
                                <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }}>
                                    No, keep order
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    backgroundColor: '#ef4444',
                                    opacity: cancelRequestLoading ? 0.7 : 1,
                                }}
                                onPress={cancelApprovedRequest}
                                disabled={cancelRequestLoading}
                            >
                                {cancelRequestLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Yes, cancel</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
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
        paddingBottom: 0,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
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
        marginTop: 20,
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
        backgroundColor: '#3477e2ff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
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
        marginBottom: 55,
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
    // Refer & Earn Styles
    referralWrap: {
        paddingHorizontal: 20,
        marginTop: 6,
        marginBottom: 6,
    },
    referralCard: {
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(251, 146, 60, 0.35)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    refHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EA580C',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    refBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.4,
    },
    seeStatus: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    refTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#7C2D12',
        marginTop: 12,
    },
    refSubtitle: {
        fontSize: 13,
        color: '#9A3412',
        marginTop: 6,
        lineHeight: 18,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
    },
    codeLabel: {
        fontSize: 12,
        color: '#7C2D12',
        fontWeight: '700',
        marginRight: 10,
    },
    codePill: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(251, 146, 60, 0.5)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    codeText: { fontSize: 14, fontWeight: '800', color: '#9A3412', letterSpacing: 1 },
    copyText: { color: '#0f172a', fontSize: 12, fontWeight: '700', marginLeft: 6 },
    refActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    inviteBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
    },
    inviteGrad: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    inviteText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    whatsBtn: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(22, 163, 74, 0.35)',
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        backgroundColor: '#F0FDF4',
    },
    whatsText: { color: '#166534', fontWeight: '800', fontSize: 14 },
    // Enter Referral Code Style
    card: {
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(251,146,60,0.4)',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    subtitle: {
        fontSize: 13,
        color: '#000',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(251,146,60,0.4)',
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#7C2D12',
        paddingVertical: 10,
        letterSpacing: 1,
    },
    applyBtn: {
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
        minWidth: 80,
    },
    applyGrad: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    applyText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    // ==== New attractive subscription styles ====
    subCardNew: {
        width: '90%',
        alignSelf: 'center',
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },

    subHero: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    subHeroLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },

    subHeroIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: 'rgba(5,150,105,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    subHeroTitle: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        marginBottom: 2,
    },

    subHeroMeta: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '700',
    },

    subStatusChip: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },

    subChipActive: {
        backgroundColor: 'rgba(236,253,245,0.9)',
        borderColor: 'rgba(16,185,129,0.35)',
    },

    subChipPaused: {
        backgroundColor: '#F1F5F9',
        borderColor: 'rgba(100,116,139,0.35)',
    },

    subStatusText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#065F46',
    },

    subBody: {
        padding: 14,
    },

    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    progressTrack: {
        flex: 1,
        height: 10,
        backgroundColor: '#E2E8F0',
        borderRadius: 999,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 999,
    },

    progressPct: {
        width: 44,
        textAlign: 'right',
        marginLeft: 8,
        color: '#0F172A',
        fontWeight: '800',
        fontSize: 12,
    },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },

    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },

    statBadgeEm: {
        backgroundColor: '#ECFDF5',
        borderColor: 'rgba(16,185,129,0.35)',
    },

    statText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
    },

    subActionsRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    actionsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 10 },
    outlineBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#fff',
    },
    outlineText: { color: '#111827', fontWeight: '800', fontSize: 12 },
    actionGradBtn: { borderRadius: 10, overflow: 'hidden' },
    gradInner: { paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    gradText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    primaryBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
    },
    primaryGrad: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primaryText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: {
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.3,
    },
    renewWrap: {
        marginTop: 10,
    },
    renewBtnOuter: {
        borderRadius: 14,
        overflow: 'hidden',
        // shadow / elevation for highlight
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
    },
    renewGradFull: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    renewTitle: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    renewPill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    renewPillText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    renewPendingPill: {
        marginTop: 12,
        alignSelf: 'stretch',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    renewPendingText: { color: '#92400E', fontWeight: '800', fontSize: 12 },
    // --- Pending payment fixed bar ---
    pendingBarWrap: {
        position: 'absolute',
        left: 0, right: 0, bottom: -5,
        zIndex: 100,
    },
    pendingBar: {
        margin: 12,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pendingTitle: { color: '#fff', fontWeight: '900', fontSize: 14 },
    pendingMeta: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 12 },
    pendingPrice: { color: '#fff', fontWeight: '900', marginRight: 8 },
    payBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    payBtnText: { color: '#fff', fontWeight: '900' },
});
