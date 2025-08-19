import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const handleStartDatePress = (day) => {
    setStartDate(new Date(day.dateString));
    closeStartDatePicker();
  };

  const handleEndDatePress = (day) => {
    setEndDate(new Date(day.dateString));
    closeEndDatePicker();
  };

  useEffect(() => {
    setPackageDetails(props.route.params);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Image fallback =====
  const [imgError, setImgError] = useState(false);
  const productImageSource =
    !imgError && packageDetails?.flower_products?.product_image_url
      ? { uri: packageDetails.flower_products.product_image_url }
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

          {/* Pause / Resume */}
          {moment(packageDetails?.start_date).format('YYYY-MM-DD') <=
            moment().format('YYYY-MM-DD') && (
              <View style={styles.detailsCard}>
                {packageDetails?.status === 'active' ? (
                  <View style={{ marginHorizontal: 10 }}>
                    <Text style={styles.label}>Pause Start Date</Text>
                    <TouchableOpacity onPress={openStartDatePicker}>
                      <TextInput
                        style={styles.input}
                        value={startDate.toLocaleDateString()}
                        editable={false}
                      />
                    </TouchableOpacity>

                    <Text style={styles.label}>Pause End Date</Text>
                    <TouchableOpacity onPress={openEndDatePicker}>
                      <TextInput
                        style={styles.input}
                        value={endDate.toLocaleDateString()}
                        editable={false}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateButton} onPress={submitPauseDates}>
                      <Text style={styles.dateText}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                ) : packageDetails?.status === 'paused' ? (
                  <View style={{ marginHorizontal: 10 }}>
                    <Text style={{ color: '#c9170a', fontSize: 16, fontWeight: '800' }}>
                      Your subscription is paused from{' '}
                      {moment(packageDetails?.pause_start_date).format('DD-MM-YYYY')} to{' '}
                      {moment(packageDetails?.pause_end_date).format('DD-MM-YYYY')}
                    </Text>
                    <TouchableOpacity onPress={handleResumeButton}>
                      <LinearGradient colors={['#c9170a', '#f0837f']} style={styles.submitButton}>
                        <Text style={styles.submitText}>Resume</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
        </ScrollView>
        {/* ===== Redesigned content ends here ===== */}
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
});
