import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ToastAndroid,
    Platform,
    ActivityIndicator,
    TextInput,
    FlatList,
    Modal,
    Linking,
    RefreshControl,
    Animated,
    Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import moment from 'moment';
import DropDownPicker from 'react-native-dropdown-picker';
import { Calendar } from 'react-native-calendars';
import { base_url } from '../../../App';

const currency = (v) => {
    const n = Number(v);
    if (Number.isFinite(n)) return `₹ ${n.toFixed(2)}`;
    return '₹ 0.00';
};

export default function PackageCheckout(props) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const route = useRoute();

    // ✅ Only use incoming params (no demo fallback)
    const pkg = route?.params || props?.route?.params || {};

    const [expanded, setExpanded] = useState(false);

    // --- old functionality state (merged) ---
    const [isLoading, setIsLoading] = useState(false);
    const [spinner, setSpinner] = useState(false);
    const [errorModal, setErrorModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const [profileDetails, setProfileDetails] = useState({});
    const [suggestions, setSuggestions] = useState('');

    // start date
    const [dob, setDob] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const openDatePicker = () => setDatePickerVisibility(true);
    const closeDatePicker = () => setDatePickerVisibility(false);

    // address list & selection
    const [allAddresses, setAllAddresses] = useState([]);
    const [displayedAddresses, setDisplayedAddresses] = useState([]);
    const [selectedOption, setSelectedOption] = useState('');
    const [showAllAddresses, setShowAllAddresses] = useState(false);
    const [addressError, setAddressError] = useState('');
    const [addressErrorMessageVisible, setAddressErrorMessageVisible] = useState(false);

    // add address modal + dropdowns
    const [addAddressModal, setAddAddressModal] = useState(false);
    const [seletedAddress, setSeletedAddress] = useState(null); // residential type
    const addressTypeOptions = [
        { label: 'Individual', value: 'individual' },
        { label: 'Apartment', value: 'apartment' },
        { label: 'Business', value: 'business' },
        { label: 'Temple', value: 'temple' },
    ];

    const [plotFlatNumber, setPlotFlatNumber] = useState('');
    const [localityOpen, setLocalityOpen] = useState(false);
    const [localityValue, setLocalityValue] = useState(null);
    const [localityList, setLocalityList] = useState([]);
    const [apartmentOpen, setApartmentOpen] = useState(false);
    const [apartmentValue, setApartmentValue] = useState(null);
    const [apartmentList, setApartmentList] = useState([]);
    const [newApartment, setNewApartment] = useState('');
    const [landmark, setLandmark] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [activeAddressType, setActiveAddressType] = useState(null);
    const [errors, setErrors] = useState({});

    // design helpers
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // derived
    const hasDiscount = useMemo(() => {
        const mrp = Number(pkg?.mrp ?? 0);
        const price = Number(pkg?.price ?? 0);
        return Number.isFinite(mrp) && Number.isFinite(price) && mrp > price;
    }, [pkg]);

    const youSave = useMemo(() => {
        const mrp = Number(pkg?.mrp ?? 0);
        const price = Number(pkg?.price ?? 0);
        return mrp > price ? mrp - price : 0;
    }, [pkg]);

    const items = Array.isArray(pkg?.package_items) ? pkg.package_items : [];
    const itemsCount = items.length;

    // ------- API bits from old page -------
    const displayErrorMessage = (message) => {
        setAddressError(message);
        setAddressErrorMessageVisible(true);
        setTimeout(() => {
            setAddressErrorMessageVisible(false);
            setAddressError('');
        }, 8000);
    };

    const getProfile = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        try {
            const res = await fetch(base_url + 'api/user/details', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
            });
            const json = await res.json();
            if (json?.success === true) setProfileDetails(json.user || {});
        } catch (e) {
            console.log('profile error', e);
        }
    };

    const getAllLocality = async () => {
        try {
            const response = await fetch(base_url + 'api/localities', {
                method: 'GET',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            });
            const json = await response.json();
            if (json?.success === 200) {
                const localityData = (json?.data || []).map((item) => ({
                    label: item.locality_name,
                    value: String(item.unique_code),
                    pincode: item.pincode,
                    apartment: item.apartment || [],
                }));
                setLocalityList(localityData);
            }
        } catch (error) {
            console.log('locality error', error);
        }
    };

    const handleLocalitySelect = (value) => {
        setLocalityValue(value);
        const selectedLocality = localityList.find((x) => String(x.value) === String(value));
        if (selectedLocality) {
            setPincode(selectedLocality.pincode);
            const apartments = (selectedLocality.apartment || []).map((a) => ({
                label: a.apartment_name,
                value: a.apartment_name,
            }));
            setApartmentList(apartments);
            setApartmentValue(null);
            setNewApartment('');
        }
    };

    const getAllAddress = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        try {
            setSpinner(true);
            const res = await fetch(base_url + 'api/mngaddress', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
            });
            const json = await res.json();
            if (json?.success === 200) {
                const arr = Array.isArray(json?.addressData) ? json.addressData : [];
                setAllAddresses(arr);
                setDisplayedAddresses(arr.slice(0, 1));
                // auto-select first address
                if (arr.length > 0) setSelectedOption(arr[0].id);
            }
        } catch (e) {
            console.log('address error', e);
        } finally {
            setSpinner(false);
        }
    };

    const toggleAddresses = () => {
        setShowAllAddresses((prev) => !prev);
        setDisplayedAddresses(!showAllAddresses ? allAddresses : allAddresses.slice(0, 1));
    };

    const validateFields = () => {
        let ok = true;
        const e = {};
        if (seletedAddress === null) {
            e.residential = 'Please select residential type';
            ok = false;
        }
        if (!plotFlatNumber) {
            e.plotFlatNumber = 'Plot/Flat Number is required';
            ok = false;
        }
        if (localityValue === null) {
            e.locality = 'Locality is required';
            ok = false;
        }
        if (apartmentList.length > 0 && apartmentValue === null) {
            e.apartment = 'Apartment is required';
            ok = false;
        }
        if (apartmentList.length === 0 && !newApartment) {
            e.apartment = 'Apartment is required';
            ok = false;
        }
        if (!landmark) {
            e.landmark = 'Landmark is required';
            ok = false;
        }
        if (!city) {
            e.city = 'City is required';
            ok = false;
        }
        if (!state) {
            e.state = 'State is required';
            ok = false;
        }
        if (!pincode) {
            e.pincode = 'Pincode is required';
            ok = false;
        } else if (String(pincode).length !== 6) {
            e.pincode = 'Pincode must be 6 digits';
            ok = false;
        }
        if (activeAddressType === null) {
            e.activeAddressType = 'Please select address type';
            ok = false;
        }
        setErrors(e);
        return ok;
    };

    const closeAddAddressModal = () => {
        setSeletedAddress(null);
        setPlotFlatNumber('');
        setLocalityValue(null);
        setApartmentValue(null);
        setNewApartment('');
        setLandmark('');
        setCity('');
        setState('');
        setPincode('');
        setActiveAddressType(null);
        setAddAddressModal(false);
        setErrors({});
    };

    const saveAddress = async () => {
        if (!validateFields()) return;
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        const finalApartment = apartmentList.length > 0 && apartmentValue !== 'add_new'
            ? apartmentValue
            : newApartment;

        try {
            const res = await fetch(base_url + 'api/saveaddress', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    country: 'India',
                    state,
                    city,
                    pincode,
                    address_type: activeAddressType,
                    locality: localityValue,
                    apartment_name: finalApartment,
                    place_category: String(seletedAddress),
                    apartment_flat_plot: plotFlatNumber,
                    landmark,
                }),
            });
            const json = await res.json();
            if (json?.success === 200) {
                setAddAddressModal(false);
                await getAllAddress();
                closeAddAddressModal();
            } else {
                setErrorModal(true);
                setErrorMsg(json?.message || 'Failed to save address');
            }
        } catch (e) {
            setErrorModal(true);
            setErrorMsg('Error saving address');
        }
    };

    const handleDayPress = (day) => {
        setDob(new Date(day.dateString));
        closeDatePicker();
    };

    const handleBuy = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        setIsLoading(true);
        try {
            if (!selectedOption) {
                displayErrorMessage('Please select your address');
                setIsLoading(false);
                return;
            }

            // Razorpay
            const options = {
                description: pkg?.name,
                image: '',
                currency: 'INR',
                key: 'rzp_live_m8GAuZDtZ9W0AI',
                amount: Number(pkg?.price || 0) * 100, // paise
                name: profileDetails?.name || '33Crores',
                order_id: '',
                prefill: {
                    email: profileDetails?.email || '',
                    contact: profileDetails?.mobile_number || '',
                    name: profileDetails?.name || '',
                },
                theme: { color: '#53a20e' },
            };
            const rz = await RazorpayCheckout.open(options);

            // Confirm order to backend
            const res = await fetch(base_url + 'api/product-subscription', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    product_id: pkg?.product_id,
                    address_id: selectedOption,
                    payment_id: rz?.razorpay_payment_id || '',
                    start_date: moment(dob).format('YYYY-MM-DD'),
                    duration: pkg?.duration ? pkg?.duration : 1,
                    paid_amount: pkg?.price,
                    suggestion: suggestions,
                }),
            });
            const json = await res.json();
            if (res.ok) {
                setOrderModalVisible(true);
            } else {
                setErrorModal(true);
                setErrorMsg(json?.message || 'Unable to place order');
            }
        } catch (error) {
            setErrorModal(true);
            setErrorMsg(error?.message || 'Payment cancelled or failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // boot
        getProfile();
        getAllLocality();
        getAllAddress();
        // console.log("Product Checkout", props?.route?.params);
    }, []);

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
                        <Icon name="arrow-left" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Product Checkout</Text>
                    <View style={styles.headerIcon} />
                </View>
                <Text style={styles.headerSubtitle}>Review your package and complete the purchase.</Text>
            </LinearGradient>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 70 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={spinner} onRefresh={getAllAddress} />}
            >
                {/* Package hero (new design) */}
                <View style={styles.card}>
                    <View style={styles.heroRow}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <View style={styles.badgeRow}>
                                {!!pkg?.duration && (
                                    <View style={styles.badge}>
                                        <Icon name="clock" size={10} color="#7C2D12" />
                                        <Text style={styles.badgeText}>
                                            {pkg.duration} {pkg.duration > 1 ? 'months' : 'month'}
                                        </Text>
                                    </View>
                                )}
                                {hasDiscount && (
                                    <View
                                        style={[
                                            styles.badge,
                                            { backgroundColor: '#FEF3C7', borderColor: 'rgba(245,158,11,0.35)' },
                                        ]}
                                    >
                                        <Icon name="tags" size={10} color="#7C2D12" />
                                        <Text style={styles.badgeText}>You save {currency(youSave)}</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.pkgTitle} numberOfLines={2}>
                                {pkg?.name ?? '—'}
                            </Text>

                            <Text style={styles.pkgDesc} numberOfLines={expanded ? 0 : 3}>
                                {pkg?.description || '—'}
                            </Text>
                            {pkg?.description && pkg.description.length > 120 && (
                                <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
                                    <Text style={styles.seeMore}>{expanded ? 'Show less' : 'Read more'}</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.priceRow}>
                                <Text style={styles.priceNow}>{currency(pkg?.price)}</Text>
                                {hasDiscount && <Text style={styles.priceMrp}>{currency(pkg?.mrp)}</Text>}
                            </View>
                        </View>

                        {!!pkg?.product_image && (
                            <Image source={{ uri: pkg.product_image }} style={styles.pkgImage} />
                        )}
                    </View>
                </View>

                {/* Delivery details (start date + suggestion) */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Delivery Details</Text>

                    <Text style={styles.inputLabel}>Subscription Start Date</Text>
                    <TouchableOpacity onPress={openDatePicker} activeOpacity={0.9}>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputValue}>
                                {dob ? moment(dob).format('DD-MM-YYYY') : ''}
                            </Text>
                            <MaterialCommunityIcons name="calendar-month" color={'#475569'} size={20} />
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Suggestions (optional)</Text>
                    <View style={[styles.textarea]}>
                        <TextInput
                            style={{ flex: 1, color: '#0f172a' }}
                            onChangeText={setSuggestions}
                            value={suggestions}
                            multiline
                            placeholder="Any suggestions? We will pass it on…"
                            placeholderTextColor="#94A3B8"
                            underlineColorAndroid="transparent"
                        />
                    </View>
                </View>

                {/* Addresses (old logic, refreshed UI) */}
                <View style={styles.card}>
                    <View style={styles.addrHeaderRow}>
                        <Text style={styles.sectionTitle}>Deliver To</Text>
                        <TouchableOpacity onPress={() => setAddAddressModal(true)} style={styles.addBtn}>
                            <Icon name="plus" size={12} color="#7C2D12" />
                            <Text style={styles.addBtnText}>Add Address</Text>
                        </TouchableOpacity>
                    </View>

                    {addressErrorMessageVisible ? (
                        <Text style={{ color: '#DC2626', fontWeight: '700', marginBottom: 8 }}>
                            {addressError}
                        </Text>
                    ) : null}

                    <FlatList
                        data={displayedAddresses}
                        keyExtractor={(item) => String(item.id)}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        renderItem={({ item }) => {
                            const isSelected = String(selectedOption) === String(item.id);
                            return (
                                <TouchableOpacity
                                    onPress={() => setSelectedOption(item.id)}
                                    activeOpacity={0.9}
                                    style={[
                                        styles.addrRow,
                                        isSelected && { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
                                    ]}
                                >
                                    <View style={{ width: 28, alignItems: 'center' }}>
                                        {item.address_type === 'Home' && <Feather name="home" size={16} color="#475569" />}
                                        {item.address_type === 'Work' && (
                                            <Feather name="briefcase" size={16} color="#475569" />
                                        )}
                                        {item.address_type === 'Other' && <Feather name="globe" size={16} color="#475569" />}
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.addrTitle}>{item.address_type}</Text>
                                        <Text style={styles.addrLine}>
                                            {item.apartment_name}, {item.apartment_flat_plot}, {item.landmark}
                                        </Text>
                                        <Text style={styles.addrLine}>
                                            {item?.locality_details?.locality_name}, {item.city}, {item.state}
                                        </Text>
                                        <Text style={styles.addrLine}>
                                            {item.pincode} • {item.place_category}
                                        </Text>
                                    </View>

                                    <View style={{ paddingLeft: 10 }}>
                                        {isSelected ? (
                                            <MaterialCommunityIcons name="record-circle" color={'#F59E0B'} size={22} />
                                        ) : (
                                            <Feather name="circle" color={'#94A3B8'} size={20} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={{ color: '#64748B', fontWeight: '600' }}>
                                No addresses found. Add a new one.
                            </Text>
                        }
                    />

                    {allAddresses.length > 1 && (
                        <TouchableOpacity onPress={toggleAddresses} style={styles.showAllBtn}>
                            <Text style={styles.showAllText}>
                                {showAllAddresses ? 'Hide addresses' : 'Show all addresses'}
                            </Text>
                            <Icon
                                name={showAllAddresses ? 'angle-up' : 'angle-down'}
                                size={16}
                                color="#0f172a"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Items list */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>What’s inside ({itemsCount} items)</Text>

                    {/* Scroll only this section */}
                    <View style={{ maxHeight: 300 }}>
                        <ScrollView
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.listWrap}>
                                {items.map((it, idx) => (
                                    <View key={String(it.item_id ?? it.id ?? idx)} style={styles.itemRow}>
                                        <View style={styles.itemIcon}>
                                            <Icon name="leaf" size={12} color="#166534" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{it.item_name}</Text>
                                        </View>
                                        {!!it.variant_title && (
                                            <Text style={styles.itemMeta}>{it.variant_title}</Text>
                                        )}
                                    </View>
                                ))}
                                {itemsCount === 0 && (
                                    <Text style={{ color: '#64748B', fontWeight: '600' }}>
                                        No items listed.
                                    </Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Order summary */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.sumLabel}>Package Price</Text>
                        <Text style={styles.sumValue}>{currency(pkg?.mrp)}</Text>
                    </View>

                    {hasDiscount && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.sumLabel, { color: '#16A34A' }]}>You Save</Text>
                            <Text style={[styles.sumValue, { color: '#16A34A' }]}>{currency(youSave)}</Text>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <Text style={styles.sumLabel}>Delivery</Text>
                        <Text style={[styles.sumValue, { color: '#16A34A', fontWeight: '800' }]}>Free</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.sumTotal}>Total</Text>
                        <Text style={styles.sumTotal}>{currency(pkg?.price)}</Text>
                    </View>
                </View>

                {/* Info */}
                <View style={[styles.card, { paddingVertical: 14 }]}>
                    <View style={styles.infoRow}>
                        <Icon name="undo" size={12} color="#0f172a" />
                        <Text style={styles.infoText}>No returns on puja consumables.</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="shield-alt" size={12} color="#0f172a" />
                        <Text style={styles.infoText}>100% genuine & fresh items.</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky footer */}
            <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.footerTitle}>Payable</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.footerPrice}>{currency(pkg?.price)}</Text>
                        {hasDiscount && <Text style={styles.footerMrp}>{currency(pkg?.mrp)}</Text>}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.payBtn, isLoading && { opacity: 0.7 }]}
                    activeOpacity={0.9}
                    onPress={handleBuy}
                    disabled={isLoading}
                >
                    <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.payGrad}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="lock" size={12} color="#fff" />
                                <Text style={styles.payText}>Proceed to Pay</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Date Picker Modal */}
            <Modal transparent visible={isDatePickerVisible} onRequestClose={closeDatePicker}>
                <View style={styles.centerOverlay}>
                    <View style={styles.calendarWrap}>
                        <Calendar
                            onDayPress={handleDayPress}
                            markedDates={{
                                [moment(dob).format('YYYY-MM-DD')]: {
                                    selected: true,
                                    marked: true,
                                    selectedColor: '#2563EB',
                                },
                            }}
                            minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
                        />
                    </View>
                </View>
            </Modal>

            {/* Add Address Modal */}
            <Modal
                animationType="slide"
                transparent
                visible={addAddressModal}
                onRequestClose={() => setAddAddressModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Address</Text>
                        <TouchableOpacity onPress={closeAddAddressModal}>
                            <Ionicons name="close" color={'#0f172a'} size={28} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 16 }}>
                        {/* Residential Type */}
                        <Text style={styles.inputLabel}>Residential Type</Text>
                        <View style={{ marginBottom: 10 }}>
                            {addressTypeOptions
                                .reduce((rows, option, index) => {
                                    if (index % 2 === 0) rows.push([]);
                                    rows[rows.length - 1].push(option);
                                    return rows;
                                }, [])
                                .map((row, rowIndex) => (
                                    <View
                                        key={`rtype-${rowIndex}`}
                                        style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}
                                    >
                                        {row.map((opt) => {
                                            const active = seletedAddress === opt.value;
                                            return (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    style={[
                                                        styles.pillChoice,
                                                        active && { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
                                                    ]}
                                                    onPress={() => setSeletedAddress(opt.value)}
                                                >
                                                    <View
                                                        style={[
                                                            styles.pillRadio,
                                                            { borderColor: active ? '#2563EB' : '#64748B' },
                                                        ]}
                                                    >
                                                        {active && <View style={styles.pillDot} />}
                                                    </View>
                                                    <Text style={[styles.pillText, { color: active ? '#1D4ED8' : '#0f172a' }]}>
                                                        {opt.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            {errors.residential && <Text style={styles.errorText}>{errors.residential}</Text>}
                        </View>

                        {/* Locality */}
                        <Text style={styles.inputLabel}>Locality</Text>
                        <View style={styles.ddCard}>
                            <DropDownPicker
                                style={{ borderColor: 'transparent' }}
                                placeholder="Select locality"
                                open={localityOpen}
                                value={localityValue}
                                items={localityList}
                                setOpen={setLocalityOpen}
                                setValue={(cb) => {
                                    const v = typeof cb === 'function' ? cb(localityValue) : cb;
                                    handleLocalitySelect(v);
                                }}
                                setItems={setLocalityList}
                                itemSeparator
                                listMode="MODAL"
                                searchable
                                searchPlaceholder="Locality..."
                            />
                        </View>
                        {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}

                        {/* Apartment */}
                        {seletedAddress === 'apartment' &&
                            <>
                                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Apartment</Text>
                                {apartmentList.length > 0 ? (
                                    <View style={styles.ddCard}>
                                        <DropDownPicker
                                            style={{ borderColor: 'transparent' }}
                                            placeholder="Select apartment"
                                            open={apartmentOpen}
                                            value={apartmentValue}
                                            items={[...apartmentList, { label: 'Add Your Apartment', value: 'add_new' }]}
                                            setOpen={setApartmentOpen}
                                            setValue={(cb) => {
                                                const v = typeof cb === 'function' ? cb(apartmentValue) : cb;
                                                setApartmentValue(v);
                                            }}
                                            setItems={setApartmentList}
                                            itemSeparator
                                            listMode="MODAL"
                                            searchable
                                            searchPlaceholder="Apartment..."
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.inputCard}>
                                        <TextInput
                                            style={styles.inputField}
                                            onChangeText={setNewApartment}
                                            value={newApartment}
                                            placeholder="Enter your apartment name"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                )}
                                {apartmentValue === 'add_new' && (
                                    <View style={[styles.inputCard, { marginTop: 10 }]}>
                                        <TextInput
                                            style={styles.inputField}
                                            onChangeText={setNewApartment}
                                            value={newApartment}
                                            placeholder="Enter your apartment name"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                )}
                                {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>}
                            </>
                        }

                        {/* Plot/Flat */}
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Plot / Flat Number</Text>
                        <View style={styles.inputCard}>
                            <TextInput
                                style={styles.inputField}
                                onChangeText={setPlotFlatNumber}
                                value={plotFlatNumber}
                                placeholder="Enter your plot/flat number"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        {errors.plotFlatNumber && <Text style={styles.errorText}>{errors.plotFlatNumber}</Text>}

                        {/* Landmark */}
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Landmark</Text>
                        <View style={styles.inputCard}>
                            <TextInput
                                style={styles.inputField}
                                onChangeText={setLandmark}
                                value={landmark}
                                placeholder="Enter landmark"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        {errors.landmark && <Text style={styles.errorText}>{errors.landmark}</Text>}

                        {/* City */}
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Town / City</Text>
                        <View style={styles.inputCard}>
                            <TextInput
                                style={styles.inputField}
                                onChangeText={setCity}
                                value={city}
                                placeholder="Enter city"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

                        {/* State */}
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>State</Text>
                        <View style={styles.inputCard}>
                            <TextInput
                                style={styles.inputField}
                                onChangeText={setState}
                                value={state}
                                placeholder="Enter state"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}

                        {/* Pincode (read-only from locality) */}
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Pincode</Text>
                        <View style={[styles.inputCard, { backgroundColor: '#F1F5F9' }]}>
                            <TextInput
                                style={styles.inputField}
                                onChangeText={setPincode}
                                value={String(pincode || '')}
                                maxLength={6}
                                editable={false}
                                keyboardType="number-pad"
                                placeholder="Auto-filled from locality"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}

                        {/* Address type */}
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Type of Address</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            {['Home', 'Work', 'Other'].map((t) => {
                                const active = activeAddressType === t;
                                return (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setActiveAddressType(t)}
                                        style={[
                                            styles.typeChip,
                                            active && { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
                                        ]}
                                    >
                                        {t === 'Home' && (
                                            <Feather name="home" color={active ? '#2563EB' : '#0f172a'} size={16} />
                                        )}
                                        {t === 'Work' && (
                                            <MaterialCommunityIcons
                                                name="office-building"
                                                color={active ? '#2563EB' : '#0f172a'}
                                                size={16}
                                            />
                                        )}
                                        {t === 'Other' && (
                                            <Feather name="globe" color={active ? '#2563EB' : '#0f172a'} size={16} />
                                        )}
                                        <Text style={[styles.typeChipText, { color: active ? '#1D4ED8' : '#0f172a' }]}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {errors.activeAddressType && (
                            <Text style={styles.errorText}>{errors.activeAddressType}</Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity onPress={saveAddress}>
                        <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.saveAddress}>
                            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Save Address</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal transparent visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
                <View style={styles.pModalContainer}>
                    <View style={styles.pModalContent}>
                        <Animated.View style={[styles.pModalCheckCircle, { transform: [{ scale: scaleAnim }] }]}>
                            <Icon name="check" color={'#fff'} size={42} />
                        </Animated.View>
                        <Text style={styles.pModalCongratulationsText}>Congratulations!</Text>
                        <Text style={styles.pModalDetailText}>Your order has been placed successfully.</Text>
                        <Text style={[styles.pModalCallText, { marginTop: 10 }]}>
                            For any inquiry call us at this number
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL('tel:9776888887')}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 5 }}>
                                9776888887
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.replace('ProductHistory')}
                        style={styles.pModalButton}
                    >
                        <Text style={styles.pModalButtonText}>Order Details</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal transparent visible={errorModal} onRequestClose={() => setErrorModal(false)}>
                <View style={styles.errorModalOverlay}>
                    <View style={styles.errorModalContainer}>
                        <View style={{ alignItems: 'center', marginBottom: 10 }}>
                            <MaterialIcons name="report-gmailerrorred" size={80} color="red" />
                            <Text style={styles.errorTitle}>{errorMsg}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setErrorModal(false)} style={styles.confirmDeleteBtn}>
                            <Text style={styles.btnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        paddingTop: 42,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    headerSubtitle: { color: '#fff', opacity: 0.9, marginTop: 8, textAlign: 'center' },

    card: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 14,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    // hero
    heroRow: { flexDirection: 'row', alignItems: 'center' },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#FFE7D1',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(251,146,60,0.35)',
    },
    badgeText: { color: '#7C2D12', fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },

    pkgTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    pkgDesc: { marginTop: 6, color: '#475569', lineHeight: 18 },
    seeMore: { marginTop: 6, color: '#7C2D12', fontWeight: '800' },

    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, gap: 8 },
    priceNow: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    priceMrp: { fontSize: 14, color: '#64748B', textDecorationLine: 'line-through' },

    pkgImage: { width: 96, height: 96, borderRadius: 16, resizeMode: 'cover' },

    // delivery details
    inputLabel: { color: '#0f172a', fontWeight: '800', marginBottom: 6 },
    inputBox: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
    },
    inputValue: { color: '#0f172a', fontWeight: '700' },
    textarea: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 70,
        backgroundColor: '#F8FAFC',
    },

    // addresses
    addrHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#FFEDD5',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.35)',
    },
    addBtnText: { color: '#7C2D12', fontWeight: '800', fontSize: 12 },
    addrRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    addrTitle: { color: '#0f172a', fontWeight: '800' },
    addrLine: { color: '#475569', fontWeight: '600', fontSize: 12, marginTop: 2 },
    showAllBtn: {
        marginTop: 10,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    showAllText: { color: '#0f172a', fontWeight: '800' },

    // items list
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
    listWrap: { gap: 10 },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 10,
    },
    itemIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.35)',
    },
    itemName: { color: '#0f172a', fontWeight: '700' },
    itemMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
    itemPrice: { color: '#0f172a', fontWeight: '800' },

    // summary
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
    sumLabel: { color: '#475569', fontWeight: '700' },
    sumValue: { color: '#0f172a', fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
    sumTotal: { color: '#0f172a', fontWeight: '900', fontSize: 16 },

    // info
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
    infoText: { color: '#0f172a', fontWeight: '700' },

    // sticky footer
    footerWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 10,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 14,
    },
    footerTitle: { color: '#64748B', fontWeight: '700', fontSize: 12 },
    footerPrice: { color: '#0f172a', fontWeight: '900', fontSize: 18, marginRight: 8 },
    footerMrp: { color: '#94A3B8', textDecorationLine: 'line-through' },
    payBtn: { borderRadius: 12, overflow: 'hidden' },
    payGrad: { paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
    payText: { color: '#fff', fontWeight: '900', fontSize: 14 },

    // modal shared
    centerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    calendarWrap: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 10 },

    // Add address modal
    modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    modalHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
    ddCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    inputCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    inputField: { height: 44, color: '#0f172a', fontSize: 15, fontWeight: '600' },
    errorText: { color: '#DC2626', fontWeight: '700', marginTop: 6 },

    pillChoice: {
        flex: 1,
        marginHorizontal: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        flexDirection: 'row',
        alignItems: 'center',
    },
    pillRadio: {
        height: 16, width: 16, borderRadius: 8, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
    },
    pillDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#2563EB' },
    pillText: { fontWeight: '800' },

    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#fff',
        marginRight: 10,
    },
    typeChipText: { fontWeight: '800' },

    saveAddress: {
        margin: 16,
        height: 50,
        borderRadius: 14,
        backgroundColor: '#FFCB44',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },

    // success modal
    pModalContainer: {
        flex: 1,
        backgroundColor: '#141416',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },
    pModalContent: { alignItems: 'center', justifyContent: 'center' },
    pModalCheckCircle: {
        marginBottom: 20,
        width: 120,
        height: 120,
        borderRadius: 100,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pModalCongratulationsText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fff',
    },
    pModalDetailText: {
        fontSize: 16,
        color: '#b6b6b6',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    pModalCallText: {
        color: '#b6b6b6',
        fontSize: 14,
        textAlign: 'center',
    },
    pModalButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 8,
        top: 100,
    },
    pModalButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // error modal
    errorModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    errorModalContainer: {
        width: '88%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        alignItems: 'center',
    },
    errorTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 8, letterSpacing: 0.2 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    confirmDeleteBtn: { backgroundColor: 'green', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 7, marginTop: 10 },
});
