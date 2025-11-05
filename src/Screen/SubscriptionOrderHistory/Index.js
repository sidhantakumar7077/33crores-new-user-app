import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { Calendar } from 'react-native-calendars';
import { base_url } from '../../../App';
import moment from 'moment';

const chipForStatus = (raw) => {
  const s = String(raw || '').toLowerCase();
  if (s === 'pending') return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
  if (s === 'active') return { bg: '#ECFDF5', text: '#065F46', label: 'Active' };
  if (s === 'paused') return { bg: '#DBEAFE', text: '#1E40AF', label: 'Paused' };
  if (s === 'expired') return { bg: '#FEE2E2', text: '#991B1B', label: 'Expired' };
  if (s === 'cancelled') return { bg: '#f4c3bdff', text: '#eb2929ff', label: 'Cancelled' };
  return { bg: '#E5E7EB', text: '#374151', label: '—' };
};

const Index = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [spinner, setSpinner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionList, setSubscriptionList] = useState([]);

  // Pause range
  const now = moment();
  const defaultStart = now.hour() >= 17 ? now.clone().add(2, 'day') : now.clone().add(1, 'day');
  const [startDate, setStartDate] = useState(new Date(defaultStart));
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  useEffect(() => { if (endDate < startDate) setEndDate(startDate); }, [startDate]);

  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const openStartDatePicker = () => setIsStartDateModalOpen(true);
  const closeStartDatePicker = () => setIsStartDateModalOpen(false);

  const [isEndDateModalOpen, setIsEndDateModalOpen] = useState(false);
  const openEndDatePicker = () => setIsEndDateModalOpen(true);
  const closeEndDatePicker = () => setIsEndDateModalOpen(false);

  const toYMD = (d) => moment(d).format('YYYY-MM-DD');

  // 5pm rule: earliest selectable date based on "now"
  const earliestByNow = () => {
    const now = moment();
    const base = now.hour() >= 17 ? now.clone().add(2, 'day') : now.clone().add(1, 'day');
    return base.startOf('day');
  };

  // Build earliest resume date with bounds (pause_start_date, pause_end_date)
  const computeEarliestResume = (pauseStartStr, pauseEndStr) => {
    const base = earliestByNow(); // 5pm rule
    const psd = pauseStartStr ? moment(pauseStartStr, 'YYYY-MM-DD').startOf('day') : null;
    const ped = pauseEndStr ? moment(pauseEndStr, 'YYYY-MM-DD').startOf('day') : null;

    // earliest = max(base, pause_start_date) if psd exists
    let earliest = psd && psd.isAfter(base) ? psd.clone() : base.clone();

    // if earliest > pause_end_date, clamp to pause_end_date (and caller can handle disabled state if needed)
    if (ped && earliest.isAfter(ped)) earliest = ped.clone();
    return earliest;
  };

  // Pause modal
  const [isPauseModalVisible, setPauseModalVisible] = useState(false);
  const openPauseModal = () => setPauseModalVisible(true);
  const closePauseModal = () => setPauseModalVisible(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  // Resume modal
  const [isResumeModalVisible, setResumeModalVisible] = useState(false);
  const openResumeModal = () => setResumeModalVisible(true);
  const closeResumeModal = () => setResumeModalVisible(false);
  const [selectedResumePackageId, setSelectedResumePackageId] = useState(null);

  // Resume date picker bound to pause range
  const [isResumeDateModalOpen, setIsResumeDateModalOpen] = useState(false);
  const openResumeDatePicker = () => setIsResumeDateModalOpen(true);
  const closeResumeDatePicker = () => setIsResumeDateModalOpen(false);
  const [resumeDate, setResumeDate] = useState(null);
  const [pause_start_date, setPause_start_date] = useState(null);
  const [pause_end_date, setPause_end_date] = useState(null);

  const handleStartDatePress = (day) => { setStartDate(new Date(day.dateString)); closeStartDatePicker(); };
  const handleEndDatePress = (day) => { setEndDate(new Date(day.dateString)); closeEndDatePicker(); };
  const handleResumDatePress = (day) => {
    const picked = moment(day.dateString, 'YYYY-MM-DD').startOf('day').toDate();
    setResumeDate(picked);
    closeResumeDatePicker();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      getSubscriptionList();
    }, 800);
  }, []);

  // Auto-refresh subscription list every 30 seconds
  // useEffect(() => {
  //   const interval = setInterval(() => { getSubscriptionList(); }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  const getSubscriptionList = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setSpinner(true);
    try {
      const res = await fetch(base_url + 'api/orders-list', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + access_token,
        },
      });
      const json = await res.json();
      if (json?.success) {
        setSubscriptionList(json?.data?.subscriptions_order || []);
      } else {
        console.error('Failed to fetch packages:', json?.message);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => { if (isFocused) getSubscriptionList(); }, [isFocused]);

  const handlePauseButton = (order_id) => { setSelectedPackageId(order_id); openPauseModal(); };

  const handleResumeButton = (item) => {
    setSelectedResumePackageId(item.order_id);
    setPause_start_date(item.pause_start_date);
    setPause_end_date(item.pause_end_date);
    // Default resumeDate = earliest allowed by 5pm rule AND pause_start_date
    const earliest = computeEarliestResume(item.pause_start_date, item.pause_end_date);
    setResumeDate(earliest.toDate());

    openResumeModal();
  };

  const [isPausedEdit, setIsPausedEdit] = useState('no');
  const [selectedPauseLogId, setSelectedPauseLogId] = useState(null);

  const submitPauseDates = async () => {
    // console.log("Submitting Pause Dates", isPausedEdit, selectedPauseLogId);
    // return;
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
        getSubscriptionList();
      } else {
        Alert.alert('Error', data?.message || 'Unable to pause');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  // Cancel-pause confirm modal
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Handle cancel subscription modal
  const [cancelSubscriptionModalVisible, setCancelSubscriptionModalVisible] = useState(false);
  const openCancelsubscriptionModal = () => { setCancelSubscriptionModalVisible(true); };
  const [loadingCancelSubscription, setLoadingCancelSubscription] = useState(false);
  const [cancelSubData, setCancelSubData] = useState(null);

  const cancelSubscription = async () => {
    if (!cancelSubData) return;
    setLoadingCancelSubscription(true);

    try {
      const res = await fetch(`${base_url}api/subscriptions/cancel/${cancelSubData.id}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json();

      if (res.ok && json?.success) {
        ToastAndroid.show("Subscription cancelled successfully", ToastAndroid.SHORT);
        setCancelSubData(null);
        setCancelSubscriptionModalVisible(false);
        await getSubscriptionList();
      } else {
        ToastAndroid.show(json?.message || 'Failed to cancel subscription', ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show(error?.message || 'Something went wrong', ToastAndroid.SHORT);
    } finally {
      setLoadingCancelSubscription(false);
    }
  };

  const openCancelModal = (orderId) => {
    setCancelTargetId(orderId);
    setCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    if (!cancelLoading) {
      setCancelModalVisible(false);
      setCancelTargetId(null);
    }
  };

  const cancelScheduledPause = async (orderId) => {
    // console.log("Cancelling Scheduled Pause for Order ID:", orderId);
    // return;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(`${base_url}api/subscriptions/delete-pause/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      if (response.status === 200) {
        // Alert.alert('Success', 'Scheduled pause has been cancelled.');
        // console.log("Scheduled pause cancelled:", data);
        getSubscriptionList();
        closeCancelModal();
      } else {
        Alert.alert('Error', data?.message || 'Unable to cancel the scheduled pause');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

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
        getSubscriptionList();
      } else {
        Alert.alert('Error', data?.message || 'Unable to resume');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
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

  const renderItem = ({ item }) => {
    const product = item?.flower_products || {};
    const chip = chipForStatus(item?.status);
    const duration = product?.duration
      ? `${product.duration} Month${Number(product.duration) > 1 ? 's' : ''}`
      : null;

    const statusStr = String(item?.status || '').toLowerCase();
    const isPending = statusStr === 'pending';
    const isActive = statusStr === 'active';
    const isPaused = statusStr === 'paused';

    // payment status
    const paymentStatus = String(item?.order?.flower_payments?.payment_status || '').toLowerCase();
    const isPaymentPending = paymentStatus === 'pending';
    const isPaymentPaid = paymentStatus === 'paid';

    // pause stuff
    const showPause = isActive;
    const showResume = isPaused;
    const showEditPause = isActive && !!item?.pause_start_date;
    const isScheduledPause =
      isActive &&
      item?.pause_start_date &&
      new Date(item.pause_start_date) > new Date();

    const isAfter5pmToday = moment().isSameOrAfter(
      moment().set({ hour: 17, minute: 0, second: 0, millisecond: 0 })
    );
    const isPauseStartingTomorrow =
      item?.pause_start_date &&
      moment(item?.pause_start_date).isSame(moment().add(1, 'day'), 'day');

    const showCancelPause =
      isScheduledPause && !(isAfter5pmToday && isPauseStartingTomorrow);

    // --- remaining days ---
    const start = moment(item?.start_date, 'YYYY-MM-DD');
    const end = moment(item?.new_date || item?.end_date, 'YYYY-MM-DD');
    const today = moment().startOf('day');
    const until = end.isValid() ? moment.min(today, end) : today;

    const dur = Number(product?.duration);
    const totalDays = ({ 1: 30, 3: 90, 6: 180 }[dur]) ?? 0;

    const usedDays = start.isValid()
      ? Math.min(totalDays, Math.max(0, until.diff(start, 'days') + 1))
      : 0;

    const remainingDays = Math.max(0, totalDays - usedDays);

    // pending renewal
    const hasPendingRenewal =
      item?.pending_renewals && Object.keys(item.pending_renewals).length > 0;

    // ----- ACTION CASES (same as previous list) -----
    // case1: pending + payment pending
    const showCase1 = isPending && isPaymentPending;
    // case6: pending + payment paid
    const showCase6 = isPending && isPaymentPaid;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('SubscriptionOrderDetailsPage', item)}
        style={styles.card}
      >
        <View style={styles.row}>
          {!!product?.product_image ? (
            <Image source={{ uri: product.product_image }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Icon name="leaf" size={18} color="#6B7280" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {product?.name || 'Subscription'}
            </Text>
            <Text style={styles.meta}>
              Order ID: <Text style={styles.metaBold}>{item?.order_id}</Text>
            </Text>

            {/* price + duration + status */}
            <View style={styles.badgesRow}>
              {product?.price ? (
                <View style={[styles.chip, styles.moneyChip]}>
                  <Text style={styles.moneyText}>
                    ₹ {Number(item?.order?.total_price).toFixed(2)}
                  </Text>
                </View>
              ) : null}

              {!!duration && (
                <View style={[styles.chip, styles.infoChip]}>
                  <Icon name="clock" size={10} color="#1F2937" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>{duration}</Text>
                </View>
              )}

              <View style={[styles.chip, { backgroundColor: chip.bg, borderColor: chip.bg }]}>
                <Text style={[styles.chipText, { color: chip.text }]}>{chip.label}</Text>
              </View>
            </View>

            {/* contextual info */}
            {statusStr === 'pending' && (
              <Text style={[styles.noteText, { marginTop: 6 }]}>
                Starts on {moment(item?.start_date).format('DD MMM YYYY')}
              </Text>
            )}
            {statusStr === 'paused' && item?.pause_end_date && (
              <Text style={[styles.noteText, { marginTop: 6 }]}>
                Paused till {moment(item?.pause_end_date).format('DD MMM YYYY')}
              </Text>
            )}
          </View>
        </View>

        {/* actions */}
        <View style={styles.actionsRow}>
          {/* always */}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('SubscriptionOrderDetailsPage', item)}
          >
            <Text style={styles.outlineText}>View Details</Text>
          </TouchableOpacity>

          {/* 1) pending + payment pending */}
          {showCase1 && (
            <>
              <TouchableOpacity
                style={[styles.outlineBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
                onPress={() => {
                  openCancelsubscriptionModal();
                  setCancelSubData(item);
                }}
              >
                <Text style={[styles.outlineText, { color: '#DC2626' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, { backgroundColor: '#c6f3e1ff', borderColor: '#10B981' }]}
                onPress={() => navigation.navigate('SubscriptionOrderDetailsPage', item)}
              >
                <Text style={[styles.outlineText, { color: '#10B981' }]}>Pay</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 2) active -> pause (but only if not in case1/case6) */}
          {!showCase1 && !showCase6 && showPause && !showEditPause && (
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

          {/* 3) active + pause scheduled -> edit */}
          {!showCase1 && !showCase6 && showEditPause && (
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

          {/* 4) cancel pause */}
          {!showCase1 && !showCase6 && showCancelPause && (
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

          {/* 5) paused -> resume */}
          {!showCase1 && !showCase6 && showResume && (
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

        {/* 6) pending + payment paid -> text BELOW buttons */}
        {showCase6 && (
          <View style={{ marginTop: 10 }}>
            <View style={[styles.renewPendingPill, { marginLeft: 0 }]}>
              <Icon name="clock" size={12} color="#92400E" style={{ marginRight: 6 }} />
              <Text style={styles.renewPendingText}>
                Your order is active from {moment(item?.start_date).format('DD MMM YYYY')}
              </Text>
            </View>
          </View>
        )}

        {/* Renew section */}
        {remainingDays <= 5 && !hasPendingRenewal && (
          <TouchableOpacity
            style={styles.renewCtaFull}
            onPress={() => handleRenewal(item)}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.renewGrad}>
              <Icon name="redo" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.renewText}>Renew</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Icon name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Orders</Text>
          <View style={{ width: 45 }} />
        </View>
        <Text style={styles.headerSubtitle}>Track and manage your subscriptions.</Text>
      </LinearGradient>

      {/* Body */}
      {spinner ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#c9170a" />
        </View>
      ) : (
        <FlatList
          data={subscriptionList}
          keyExtractor={(item, idx) => String(idx)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyBadge}>
                <Text style={styles.emptyEmoji}>🌸</Text>
              </View>
              <Text style={styles.emptyTitle}>No Subscriptions Yet</Text>
              <Text style={styles.emptyText}>
                Create a subscription to get started.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Pause modal */}
      <Modal animationType="slide" transparent visible={isPauseModalVisible} onRequestClose={closePauseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={closePauseModal}>
              <Feather name="x" color="#000" size={26} />
            </TouchableOpacity>

            <Text style={styles.label}>Pause Start Date</Text>
            <TouchableOpacity onPress={openStartDatePicker}>
              <TextInput style={styles.input} value={moment(startDate).format('DD MMM YYYY')} editable={false} />
            </TouchableOpacity>

            <Text style={styles.label}>Pause End Date</Text>
            <TouchableOpacity onPress={openEndDatePicker}>
              <TextInput style={styles.input} value={moment(endDate).format('DD MMM YYYY')} editable={false} />
            </TouchableOpacity>

            <TouchableOpacity onPress={submitPauseDates}>
              <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Start date picker */}
      <Modal animationType="slide" transparent visible={isStartDateModalOpen} onRequestClose={closeStartDatePicker}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Calendar
              onDayPress={handleStartDatePress}
              markedDates={{
                [moment(startDate).format('YYYY-MM-DD')]: { selected: true, marked: true, selectedColor: 'blue' },
              }}
              minDate={defaultStart.format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>

      {/* End date picker */}
      <Modal animationType="slide" transparent visible={isEndDateModalOpen} onRequestClose={closeEndDatePicker}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Calendar
              onDayPress={handleEndDatePress}
              markedDates={{
                [moment(endDate).format('YYYY-MM-DD')]: { selected: true, marked: true, selectedColor: 'blue' },
              }}
              minDate={moment(startDate).format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Pause confirm modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isCancelModalVisible}
        onRequestClose={closeCancelModal}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          {/* backdrop */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            activeOpacity={1}
            onPress={!cancelLoading ? closeCancelModal : undefined}
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
              <Feather name="pause-circle" size={26} color="#fff" />
            </LinearGradient>

            {/* title + desc */}
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
              Cancel scheduled pause?
            </Text>
            <Text style={{ marginTop: 6, color: '#374151', lineHeight: 20, fontWeight: '600' }}>
              This will remove the upcoming pause for this subscription. You can schedule a new pause
              anytime later.
            </Text>

            {/* info row */}
            {!!cancelTargetId && (
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
                <Text style={{ color: '#374151', fontWeight: '700' }}>Order ID: {cancelTargetId}</Text>
              </View>
            )}

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
                onPress={() => cancelScheduledPause(cancelTargetId)}
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
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Calendar
              onDayPress={handleResumDatePress}
              markedDates={{
                [toYMD(resumeDate || computeEarliestResume(pause_start_date, pause_end_date).toDate())]: {
                  selected: true, marked: true, selectedColor: 'blue'
                }
              }}
              minDate={
                // enforce: if after 5pm, tomorrow is NOT selectable
                computeEarliestResume(pause_start_date, pause_end_date).format('YYYY-MM-DD')
              }
              maxDate={pause_end_date ? moment(pause_end_date, 'YYYY-MM-DD').format('YYYY-MM-DD') : undefined}
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={cancelSubscriptionModalVisible}
        onRequestClose={() => setCancelSubscriptionModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          {/* backdrop */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            activeOpacity={1}
            onPress={() => setCancelSubscriptionModalVisible(false)}
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
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
              Cancel Subscription?
            </Text>
            <Text style={{ marginTop: 6, color: '#374151', lineHeight: 20, fontWeight: '600' }}>
              Cancelling your subscription will stop all future deliveries. You can resubscribe anytime.
            </Text>
            {!!cancelSubData?.subscription_id && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  marginTop: 12,
                }}
              >
                <Icon name="hashtag" size={12} color="#6B7280" />
                <Text style={{ color: '#374151', fontWeight: '700' }}>
                  Subscription ID: {cancelSubData.subscription_id}
                </Text>
              </View>
            )}
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
                onPress={() => setCancelSubscriptionModalVisible(false)}
              >
                <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }}>
                  No, keep subscription
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
                onPress={cancelSubscription}
              >
                {loadingCancelSubscription ? (
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

export default Index;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 25,
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

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Card list
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { flexDirection: 'row' },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  title: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  meta: { color: '#64748B', marginTop: 2, fontWeight: '600', fontSize: 12 },
  metaBold: { color: '#111827' },

  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },

  moneyChip: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  moneyText: { color: '#111827', fontWeight: '900', fontSize: 12 },

  infoChip: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  infoText: { color: '#1F2937', fontWeight: '800', fontSize: 11 },

  noteText: { color: '#111827', fontWeight: '700', fontSize: 12 },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, gap: 10 },
  outlineBtn: {
    width: "30%",
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
  },
  outlineText: { color: '#111827', fontWeight: '800', fontSize: 12 },

  actionGradBtn: { borderRadius: 10, overflow: 'hidden' },
  gradInner: { paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  gradText: { color: '#fff', fontWeight: '900', fontSize: 12 },
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

  emptyWrap: { alignItems: 'center', marginTop: 140, paddingHorizontal: 24 },
  emptyBadge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyEmoji: { fontSize: 30 },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  emptyText: { color: '#64748B', textAlign: 'center', fontWeight: '600' },

  // Modals (shared styles)
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerCard: { width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 },

  // Form bits
  label: { fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 6 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginBottom: 10,
    color: '#0f172a',
    paddingVertical: 6,
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
    // backgroundColor: '#c9170a',
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  renewCtaFull: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  renewGrad: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  renewText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
