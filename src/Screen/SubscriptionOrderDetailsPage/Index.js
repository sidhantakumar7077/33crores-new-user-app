import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = (props) => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [packageDetails, setPackageDetails] = useState(null);

  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );

  const fmt = (d, f = 'DD MMM YYYY') => (d ? moment(d).format(f) : '—');

  // sort newest first
  const historyData = useMemo(() => {
    const arr = packageDetails?.pause_resume_log ?? [];
    return [...arr].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [packageDetails]);

  // --- CURRENT PAUSE (if today falls within a paused window and not resumed) ---
  const currentPause = useMemo(() => {
    if (!packageDetails) return null;
    const logs = packageDetails.pause_resume_log ?? [];
    const today = moment().startOf('day');

    // 1) Prefer top-level status if available
    if (
      packageDetails.status === 'paused' &&
      packageDetails.pause_start_date &&
      packageDetails.pause_end_date
    ) {
      const s = moment(packageDetails.pause_start_date, 'YYYY-MM-DD');
      const e = moment(packageDetails.pause_end_date, 'YYYY-MM-DD');
      if (s.isValid() && e.isValid() && today.isBetween(s, e, 'day', '[]')) {
        return {
          pause_start_date: packageDetails.pause_start_date,
          pause_end_date: packageDetails.pause_end_date,
        };
      }
    }

    // 2) Derive from logs (paused windows that include today)
    const pausedWindows = logs
      .filter(l => l.action === 'paused' && l.pause_start_date && l.pause_end_date)
      .filter(l => {
        const s = moment(l.pause_start_date, 'YYYY-MM-DD');
        const e = moment(l.pause_end_date, 'YYYY-MM-DD');
        return s.isValid() && e.isValid() && today.isBetween(s, e, 'day', '[]');
      });

    if (!pausedWindows.length) return null;

    // Exclude those that have a resume inside the window on/before today
    const resumes = logs.filter(l => l.action === 'resumed' && l.resume_date);
    const active = pausedWindows.filter(p => {
      const s = moment(p.pause_start_date, 'YYYY-MM-DD');
      const e = moment(p.pause_end_date, 'YYYY-MM-DD');
      return !resumes.some(r => {
        const rd = moment(r.resume_date, 'YYYY-MM-DD');
        // if resumed anytime from start up to today, treat as not currently paused
        return rd.isValid() && rd.isSameOrAfter(s, 'day') && rd.isSameOrBefore(today, 'day');
      });
    });

    if (!active.length) return null;

    active.sort((a, b) =>
      moment(a.pause_start_date, 'YYYY-MM-DD').diff(moment(b.pause_start_date, 'YYYY-MM-DD'))
    );
    return {
      pause_start_date: active[0].pause_start_date,
      pause_end_date: active[0].pause_end_date,
    };
  }, [packageDetails]);

  const upcomingPause = useMemo(() => {
    const logs = packageDetails?.pause_resume_log ?? [];
    const today = moment().startOf('day');

    // only pauses that start AFTER today (exclude today)
    const futurePauses = logs.filter(l =>
      l.action === 'paused' &&
      l.pause_start_date &&
      moment(l.pause_start_date, 'YYYY-MM-DD').isAfter(today, 'day')
    );

    if (!futurePauses.length) return null;

    // pick the soonest one
    const [soonest] = [...futurePauses].sort((a, b) =>
      moment(a.pause_start_date, 'YYYY-MM-DD').diff(moment(b.pause_start_date, 'YYYY-MM-DD'))
    );

    return soonest;
  }, [packageDetails]);

  useEffect(() => {
    if (endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (isFocused) {
      setPackageDetails(props.route.params);
    }
  }, [isFocused, props.route.params]);

  const [isResumeModalVisible, setResumeModalVisible] = useState(false);
  const openResumeModal = () => setResumeModalVisible(true);
  const closeResumeModal = () => setResumeModalVisible(false);

  const [isResumeDateModalOpen, setIsResumeDateModalOpen] = useState(false);
  const openResumeDatePicker = () => setIsResumeDateModalOpen(true);
  const closeResumeDatePicker = () => setIsResumeDateModalOpen(false);
  const [resumeDate, setResumeDate] = useState(null);

  const [pause_start_date, setPause_start_date] = useState(null);
  const [pause_end_date, setPause_end_date] = useState(null);

  useEffect(() => {
    if (pause_start_date) {
      const today = new Date();
      const pauseStartDate = new Date(pause_start_date);
      setResumeDate(
        today > pauseStartDate ? new Date(today.setDate(today.getDate() + 1)) : pauseStartDate
      );
    }
  }, [pause_start_date]);

  const handleResumeButton = () => {
    setPause_start_date(props.route.params.pause_start_date);
    setPause_end_date(props.route.params.pause_end_date);
    openResumeModal();
  };

  const handleResumDatePress = (day) => {
    setResumeDate(new Date(day.dateString));
    closeResumeDatePicker();
  };

  const submitResumeDates = async () => {
    try {
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(
        `${base_url}api/subscription/resume/${props.route.params.order_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            resume_date: moment(resumeDate).format('YYYY-MM-DD'),
          }),
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        console.log("Resume dates submitted successfully:", data);
        closeResumeModal();
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const openStartDatePicker = () => setIsStartDateModalOpen(true);
  const closeStartDatePicker = () => setIsStartDateModalOpen(false);

  const [isEndDateModalOpen, setIsEndDateModalOpen] = useState(false);
  const openEndDatePicker = () => setIsEndDateModalOpen(true);
  const closeEndDatePicker = () => setIsEndDateModalOpen(false);

  // Cancel Pause (confirm sheet)
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const openCancelModal = () => setCancelModalVisible(true);
  const closeCancelModal = () => { if (!cancelLoading) setCancelModalVisible(false); };

  const submitPauseDates = async () => {
    try {
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(
        `${base_url}api/subscription/pause/${packageDetails.order_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            pause_start_date: moment(startDate).format('YYYY-MM-DD'),
            pause_end_date: moment(endDate).format('YYYY-MM-DD'),
          }),
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const cancelScheduledPause = async () => {
    try {
      setCancelLoading(true);
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(
        `${base_url}api/subscriptions/delete-pause/${props.route.params.order_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        // Alert.alert('Success', 'Scheduled pause has been cancelled.');
        setCancelModalVisible(false);
        // refresh local details and go back or just update UI
        navigation.goBack(); // (or re-fetch and setPackageDetails if you prefer)
      } else {
        Alert.alert('Error', data?.message || 'Unable to cancel scheduled pause');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleStartDatePress = (day) => {
    setStartDate(new Date(day.dateString));
    closeStartDatePicker();
  };

  const handleEndDatePress = (day) => {
    setEndDate(new Date(day.dateString));
    closeEndDatePicker();
  };

  const [profileDetails, setProfileDetails] = useState({});

  const getProfile = async () => {
    var access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/user/details', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });
      const responseData = await response.json();
      if (responseData.success === true) {
        // console.log("getProfile-------", responseData);
        setProfileDetails(responseData.user);
        // setImageSource(user.);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const [ispaymentLoading, setIsPaymentLoading] = useState(false);
  const [errormasg, setErrormasg] = useState(null);
  const [errorModal, setErrorModal] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const payPendingOrder = async (order_id) => {
    if (!order_id) return;

    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    const amountRupees = Number(packageDetails?.order?.total_price || 0);

    if (!amountRupees) {
      setErrormasg('Invalid amount for this order.');
      setErrorModal(true);
      return;
    }

    setIsPaymentLoading(true);
    try {
      const rzpKeyId = 'rzp_live_m8GAuZDtZ9W0AI';

      // 2) Open Razorpay Checkout
      const options = {
        description: packageDetails?.flower_products?.name || 'Subscription Payment',
        currency: 'INR',
        key: rzpKeyId,
        amount: Math.round(amountRupees * 100), // in paise
        name: profileDetails?.name || 'User',
        order_id: "",
        prefill: {
          email: profileDetails?.email,
          contact: profileDetails?.mobile_number,
          name: profileDetails?.name,
        },
        theme: { color: '#53a20e' },
      };

      const payResult = await RazorpayCheckout.open(options);

      if (!payResult?.razorpay_payment_id) {
        setErrormasg('Payment failed or cancelled');
        setErrorModal(true);
      }

      // 3) Confirm payment on your backend
      const confirmRes = await fetch(`${base_url}api/process-payment`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
        body: JSON.stringify({
          order_id: order_id,
          payment_id: payResult.razorpay_payment_id,
          paid_amount: amountRupees,
        }),
      });

      const confirmText = await confirmRes.text();
      if (!confirmText.ok) {
        setErrormasg(confirmText?.message || 'Payment verification failed');
        setErrorModal(true);
      }
      // Success 🎉
      // setOrderModalVisible(true);
      navigation.goBack();
    } catch (err) {
      setErrormasg(err?.message || 'Something went wrong during payment.');
      setErrorModal(true);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // days left + pending renewal check
  const { remainingDays, hasPendingRenewal } = useMemo(() => {
    const prod = packageDetails?.flower_products || {};
    const dur = Number(prod?.duration);
    const totalDays = ({ 1: 30, 3: 90, 6: 180 }[dur]) ?? 0;

    const start = moment(packageDetails?.start_date, 'YYYY-MM-DD');
    const end = moment(packageDetails?.new_date || packageDetails?.end_date, 'YYYY-MM-DD');

    const today = moment().startOf('day');
    const until = end.isValid() ? moment.min(today, end) : today;

    const usedDays = start.isValid()
      ? Math.min(totalDays, Math.max(0, until.diff(start, 'days') + 1))
      : 0;

    const left = Math.max(0, totalDays - usedDays);

    const pending =
      packageDetails?.pending_renewals &&
      Object.keys(packageDetails.pending_renewals).length > 0;

    return { remainingDays: left, hasPendingRenewal: pending };
  }, [packageDetails]);

  useEffect(() => {
    setPackageDetails(props.route.params);
    getProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Image fallback =====
  const [imgError, setImgError] = useState(false);
  const productImageSource =
    !imgError && packageDetails?.flower_products?.product_image
      ? { uri: packageDetails.flower_products.product_image }
      : require('../../assets/images/flower.png'); // default/fallback

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.mainView}>
        {/* Header */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Subscription Details</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>View and manage your subscription orders here.</Text>
          </View>
        </LinearGradient>

        {/* ===== Redesigned content starts here ===== */}
        <ScrollView style={{ flex: 1 }}>
          {/* Product Hero */}
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <Image
                source={productImageSource}
                onError={() => setImgError(true)}
                style={styles.productImg}
              />
              <View style={styles.productMeta}>
                <Text style={styles.productName}>
                  {packageDetails?.flower_products?.name ?? '—'}
                </Text>
                {!!packageDetails?.flower_products?.description && (
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {packageDetails?.flower_products?.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Feather name="hash" size={12} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.chipText}>Order {packageDetails?.order_id}</Text>
              </View>

              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      packageDetails?.status === 'active'
                        ? '#ECFDF5'
                        : packageDetails?.status === 'paused'
                          ? '#FEF3C7'
                          : '#F1F5F9',
                    borderColor:
                      packageDetails?.status === 'active'
                        ? '#16A34A'
                        : packageDetails?.status === 'paused'
                          ? '#F59E0B'
                          : '#94A3B8',
                  },
                ]}
              >
                <Feather
                  name={
                    packageDetails?.status === 'active'
                      ? 'check-circle'
                      : packageDetails?.status === 'paused'
                        ? 'pause-circle'
                        : 'info'
                  }
                  size={12}
                  color={
                    packageDetails?.status === 'active'
                      ? '#16A34A'
                      : packageDetails?.status === 'paused'
                        ? '#B45309'
                        : '#475569'
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        packageDetails?.status === 'active'
                          ? '#065F46'
                          : packageDetails?.status === 'paused'
                            ? '#92400E'
                            : '#334155',
                    },
                  ]}
                >
                  {packageDetails?.status ?? '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Current pause banner */}
          {currentPause && (
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
              ]}
            >
              <Feather name="pause-circle" size={16} color="#B91C1C" style={{ marginRight: 8 }} />
              <Text style={[styles.noticeText, { color: '#B91C1C' }]}>
                Your subscription is paused Now (
                {moment(currentPause.pause_start_date).format('DD MMM YYYY')}
                {' to '}
                {moment(currentPause.pause_end_date).format('DD MMM YYYY')}
                ).
              </Text>
            </View>
          )}

          {/* Upcoming pause banner */}
          {upcomingPause && (
            <View style={[styles.noticeCard, { alignItems: 'center' }]}>
              <Feather name="alert-triangle" size={16} color="#92400E" style={{ marginRight: 8 }} />
              <Text style={[styles.noticeText, { marginRight: 8 }]}>
                Upcoming pause scheduled from{' '}
                {moment(upcomingPause.pause_start_date).format('DD MMM YYYY')}
                {upcomingPause.pause_end_date
                  ? ` to ${moment(upcomingPause.pause_end_date).format('DD MMM YYYY')}`
                  : ''}
                .
              </Text>

              {/* Cancel Pause trigger (only if start is today or later) */}
              {/* {moment(upcomingPause.pause_start_date, 'YYYY-MM-DD').isSameOrAfter(moment().startOf('day')) && (
                <TouchableOpacity
                  onPress={openCancelModal}
                  activeOpacity={0.9}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: '#ef4444',
                    borderWidth: 1,
                    borderColor: '#fca5a5',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Cancel Pause</Text>
                </TouchableOpacity>
              )} */}
            </View>
          )}

          {/* Pause / Resume */}
          {/* {moment(packageDetails?.start_date).format('YYYY-MM-DD') <= moment().format('YYYY-MM-DD') && (
            <View
              style={{
                width: '90%',
                alignSelf: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 14,
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Feather
                  name={packageDetails?.status === 'active' ? 'pause-circle' : 'play-circle'}
                  size={18}
                  color="#0f172a"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                  {packageDetails?.status === 'active' ? 'Pause Subscription' : 'Resume Subscription'}
                </Text>
              </View>

              {packageDetails?.status === 'active' ? (
                <View>
                  <Text style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
                    Choose the dates you want to pause deliveries.
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#334155',
                      marginTop: 4,
                      marginBottom: 6,
                    }}
                  >
                    Pause Start Date
                  </Text>
                  <TouchableOpacity
                    onPress={openStartDatePicker}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: '#F8FAFC',
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name="calendar" size={16} color="#0f172a" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '600' }}>
                      {startDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#334155',
                      marginBottom: 6,
                    }}
                  >
                    Pause End Date
                  </Text>
                  <TouchableOpacity
                    onPress={openEndDatePicker}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: '#F8FAFC',
                      marginBottom: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name="calendar" size={16} color="#0f172a" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '600' }}>
                      {endDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={submitPauseDates}
                    activeOpacity={0.9}
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['#c9170a', '#f0837f']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 }}>
                        Submit
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : packageDetails?.status === 'paused' ? (
                <View>
                  <View
                    style={{
                      backgroundColor: '#FEE2E2',
                      borderColor: '#FCA5A5',
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: '#B91C1C', fontSize: 14, fontWeight: '700' }}>
                      Your subscription is paused from{' '}
                      {moment(packageDetails?.pause_start_date).format('DD-MM-YYYY')} to{' '}
                      {moment(packageDetails?.pause_end_date).format('DD-MM-YYYY')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleResumeButton}
                    activeOpacity={0.9}
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['#10B981', '#34D399']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 }}>
                        Resume
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )} */}

          {/* Details */}
          <View style={styles.detailsCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {moment(packageDetails?.start_date).format('DD-MM-YYYY')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text
                style={[styles.infoValue, packageDetails?.new_date ? styles.infoValueStrike : null]}
              >
                {moment(packageDetails?.end_date).format('DD-MM-YYYY')}
              </Text>
            </View>

            {!!packageDetails?.new_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>New End Date</Text>
                <Text style={styles.infoValue}>
                  {moment(packageDetails?.new_date).format('DD-MM-YYYY')}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={[styles.infoValue, { fontWeight: '800', color: '#16A34A' }]}>
                {packageDetails?.order?.total_price ?? '—'}
              </Text>
            </View>
          </View>

          {/* Address */}
          {packageDetails?.order?.address && (
            <View style={styles.addressCard}>
              <Text style={styles.subtitle}>Delivery Address</Text>
              <Text style={styles.addressLine}>
                {packageDetails?.order?.address?.address_type},{' '}
                {packageDetails?.order?.address?.place_category}
              </Text>
              <Text style={styles.addressLine}>
                {packageDetails?.order?.address?.apartment_flat_plot},{' '}
                {packageDetails?.order?.address?.landmark}
              </Text>
              <Text style={styles.addressLine}>
                {packageDetails?.order?.address?.locality_details?.locality_name},{' '}
                {packageDetails?.order?.address?.city}
              </Text>
              <Text style={styles.addressLine}>
                {packageDetails?.order?.address?.state},{' '}
                {packageDetails?.order?.address?.pincode}
              </Text>
              <Text style={styles.addressLine}>{packageDetails?.order?.address?.country}</Text>
            </View>
          )}

          {Array.isArray(historyData) && historyData.length > 0 && (
            <View style={styles.historyCard}>
              <Text style={styles.subtitle}>Pause / Resume History</Text>

              {historyData.map((log, idx) => {
                const isPaused = log.action === 'paused';
                const iconName = isPaused ? 'pause-circle' : 'play-circle';
                const iconColor = isPaused ? '#F59E0B' : '#16A34A';

                // primary line
                const title = isPaused
                  ? `Paused ${fmt(log.pause_start_date)}${log.pause_end_date ? `–${fmt(log.pause_end_date)}` : ''}`
                  : `Resumed on ${fmt(log.resume_date)}`;

                // secondary line
                const meta = `Paused days: ${log.paused_days ?? '—'}  •  New end date: ${fmt(log.new_end_date)}`;

                // timestamp line
                const stamp = `Logged ${fmt(log.created_at, 'DD MMM YYYY, HH:mm')}`;

                return (
                  <View key={log.id ?? idx} style={styles.historyRow}>
                    {/* Left line for timeline effect */}
                    <View style={styles.historyLine} />
                    <View style={styles.historyDotWrap}>
                      <Feather name={iconName} size={18} color={iconColor} />
                    </View>

                    <View style={styles.historyContent}>
                      <Text style={styles.historyTitle}>{title}</Text>
                      <Text style={styles.historyMeta}>{meta}</Text>
                      <Text style={styles.historyStamp}>{stamp}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
        {/* ===== Redesigned content ends here ===== */}

        {/* Show a full width button for payment if status is pending and price is greater than 0 and show with price. And Add one more button for cancelling the order */}
        {packageDetails?.order?.flower_payments?.payment_status === 'pending' && packageDetails?.order?.total_price > 0 && (
          <TouchableOpacity
            onPress={() => payPendingOrder(packageDetails?.order_id)}
            activeOpacity={0.9}
            style={styles.renewButton}
          >
            {ispaymentLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.renewButtonText}>
                Pay  ₹{packageDetails?.order?.total_price ?? '0'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Full-width Renew CTA (only when ≤5 days left and no pending renewal) */}
        {remainingDays <= 5 && !hasPendingRenewal && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SubscriptionCheckoutPage', {
                flowerData: packageDetails?.flower_products,
                order_id: packageDetails?.order_id || "",
                preEndData: packageDetails?.new_date || packageDetails?.end_date || null,
              })
            }
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.renewButton}>
              <Text style={styles.renewButtonText}>Renew Subscription</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Start Date Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isStartDateModalOpen}
        onRequestClose={closeStartDatePicker}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Calendar
              onDayPress={handleStartDatePress}
              markedDates={{
                [moment(startDate).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue',
                },
              }}
              minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>

      {/* End Date Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEndDateModalOpen}
        onRequestClose={closeEndDatePicker}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Calendar
              onDayPress={handleEndDatePress}
              markedDates={{
                [moment(endDate).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue',
                },
              }}
              minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Pause – Confirm Bottom Sheet */}
      <Modal
        animationType="slide"
        transparent
        visible={isCancelModalVisible}
        onRequestClose={closeCancelModal}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            activeOpacity={1}
            onPress={!cancelLoading ? closeCancelModal : undefined}
          />

          {/* Sheet */}
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
            {/* Handle */}
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

            {/* Icon badge */}
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
              <Feather name="pause-circle" size={26} color="#fff" />
            </LinearGradient>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
              Cancel scheduled pause?
            </Text>
            <Text style={{ marginTop: 6, color: '#374151', lineHeight: 20, fontWeight: '600' }}>
              This will remove the upcoming pause for this subscription. You can schedule a new pause later.
            </Text>

            {/* Info row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                marginTop: 12,
              }}
            >
              <Feather name="hash" size={16} color="#6B7280" />
              <Text style={{ color: '#374151', fontWeight: '700' }}>
                Order ID: {props.route.params.order_id}
              </Text>
            </View>

            {/* Actions */}
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
                onPress={closeCancelModal}
                disabled={cancelLoading}
              >
                <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }}>
                  No, keep pause
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  alignItems: 'center',
                  paddingVertical: 12,
                  backgroundColor: '#ef4444',
                }}
                onPress={cancelScheduledPause}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Yes, cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resume Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isResumeModalVisible}
        onRequestClose={closeResumeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={closeResumeModal}>
              <Feather name="x" color={'#000'} size={30} />
            </TouchableOpacity>

            <Text style={styles.label}>Resume Date</Text>
            <TouchableOpacity onPress={openResumeDatePicker}>
              <TextInput
                style={styles.input}
                value={resumeDate ? resumeDate.toLocaleDateString() : 'Select a date'}
                editable={false}
              />
            </TouchableOpacity>
            {resumeDate === null && <Text style={{ color: 'red' }}>Please select a resume date</Text>}

            <TouchableOpacity style={styles.dateButton} onPress={submitResumeDates}>
              <Text style={styles.dateText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Resume Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isResumeDateModalOpen}
        onRequestClose={closeResumeDatePicker}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Calendar
              onDayPress={handleResumDatePress}
              markedDates={{
                [moment(resumeDate).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue',
                },
              }}
              minDate={moment(pause_start_date).format('YYYY-MM-DD')}
              maxDate={moment(pause_end_date).format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainView: {
    flex: 1,
    paddingBottom: 10,
  },
  // Header
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  backIcon: {
    position: 'absolute',
    left: 0,
  },
  heroContent: {},
  heroTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  // Cards (new)
  productCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImg: {
    width: 96,
    height: 96,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  productMeta: { flex: 1 },
  productName: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  productDesc: { color: '#475569', fontSize: 13, marginTop: 4 },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  detailsCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: { color: '#475569', fontSize: 14, fontWeight: '700' },
  infoValue: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  infoValueStrike: { textDecorationLine: 'line-through', color: '#64748B' },
  addressCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#495057',
  },
  addressLine: { color: '#475569', fontSize: 14, marginTop: 2 },
  // Inputs & Buttons
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#757473',
    marginBottom: 10,
    color: '#333',
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#c9170a',
    borderRadius: 5,
    marginVertical: 5,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
    marginVertical: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalSheet: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
  },
  historyCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    position: 'relative',
  },
  historyLine: {
    position: 'absolute',
    left: 9, // aligns with dot center
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  historyDotWrap: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
    zIndex: 1,
  },
  historyContent: { flex: 1 },
  historyTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  historyMeta: { color: '#475569', fontSize: 13, marginTop: 2 },
  historyStamp: { color: '#64748B', fontSize: 12, marginTop: 4 },
  noticeCard: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    // marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF3C7', // warm amber
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeText: {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  renewButton: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});