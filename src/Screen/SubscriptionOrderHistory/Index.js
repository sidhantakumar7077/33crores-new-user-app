import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, FlatList, RefreshControl, TextInput, Modal, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { Calendar } from 'react-native-calendars';
import { base_url } from '../../../App';
import moment from 'moment';

const Index = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [spinner, setSpinner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionList, setSubscriptionList] = useState([]);

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));

  useEffect(() => {
    if (endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate]);

  const handleStartDatePress = (day) => {
    setStartDate(new Date(day.dateString));
    closeStartDatePicker();
  };

  const handleEndDatePress = (day) => {
    setEndDate(new Date(day.dateString));
    closeEndDatePicker();
  };

  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const openStartDatePicker = () => { setIsStartDateModalOpen(true) };
  const closeStartDatePicker = () => { setIsStartDateModalOpen(false) };
  const [isEndDateModalOpen, setIsEndDateModalOpen] = useState(false);
  const openEndDatePicker = () => { setIsEndDateModalOpen(true) };
  const closeEndDatePicker = () => { setIsEndDateModalOpen(false) };

  const [isPauseModalVisible, setPauseModalVisible] = useState(false);
  const openPauseModal = () => setPauseModalVisible(true);
  const closePauseModal = () => setPauseModalVisible(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  const [isResumeModalVisible, setResumeModalVisible] = useState(false);
  const openResumeModal = () => setResumeModalVisible(true);
  const closeResumeModal = () => setResumeModalVisible(false);
  const [selectedResumePackageId, setSelectedResumePackageId] = useState(null);

  const [isResumeDateModalOpen, setIsResumeDateModalOpen] = useState(false);
  const openResumeDatePicker = () => { setIsResumeDateModalOpen(true) };
  const closeResumeDatePicker = () => { setIsResumeDateModalOpen(false) };
  const [resumeDate, setResumeDate] = useState(null);

  useEffect(() => {
    if (pause_start_date) {
      const today = new Date();
      const pauseStartDate = new Date(pause_start_date);
      setResumeDate(today > pauseStartDate ? new Date(today.setDate(today.getDate() + 1)) : pauseStartDate);
    }
  }, [pause_start_date]);

  const [pause_start_date, setPause_start_date] = useState(null);
  const [pause_end_date, setPause_end_date] = useState(null);

  const handleResumeButton = (item) => {
    setSelectedResumePackageId(item.order_id);
    setPause_start_date(item.pause_start_date);
    setPause_end_date(item.pause_end_date);
    openResumeModal();
  };

  const handleResumDatePress = (day) => {
    setResumeDate(new Date(day.dateString));
    closeResumeDatePicker();
  };

  const submitResumeDates = async () => {
    // console.log("object", selectedResumePackageId);
    // return;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(`${base_url}api/subscription/resume/${selectedResumePackageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          resume_date: moment(resumeDate).format('YYYY-MM-DD'),
        }),
      });

      const data = await response.json();
      console.log("response", data);
      if (response.status === 200) {
        closeResumeModal();
        getSubscriptionList();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      getSubscriptionList();
      console.log("Refreshing Successful");
    }, 2000);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getSubscriptionList();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSubscriptionList = async () => {
    var access_token = await AsyncStorage.getItem('storeAccesstoken');
    setSpinner(true);

    await fetch(base_url + 'api/orders-list', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
    }).then(response => response.json()).then(response => {
      if (response.success === 200) {
        // console.log("object", response.data);
        setSubscriptionList(response.data.subscriptions_order);
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

  const handlePauseButton = (order_id) => {
    setSelectedPackageId(order_id);
    openPauseModal();
  };

  const submitPauseDates = async () => {
    // console.log("object", selectedPackageId);
    // return;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(`${base_url}api/subscription/pause/${selectedPackageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          pause_start_date: moment(startDate).format('YYYY-MM-DD'),
          pause_end_date: moment(endDate).format('YYYY-MM-DD'),
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        closePauseModal();
        getSubscriptionList();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  useEffect(() => {
    if (isFocused) {
      getSubscriptionList();
    }
  }, [isFocused])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainView}>
        {/* Hero Header with Gradient */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Subscription Order</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              View your subscription order history and details
            </Text>
          </View>
        </LinearGradient>

        {spinner === true ?
          <View style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
          </View>
          :
          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 10 }}>
            {subscriptionList?.length > 0 ?
              <View style={{ width: '95%', alignSelf: 'center', marginTop: 10 }}>
                <FlatList
                  data={subscriptionList}
                  scrollEnabled={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("SubscriptionDetails", item)}
                      // onPress={() => console.log("Item", item)}
                      style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6, overflow: 'hidden' }}
                    >
                      <Image source={{ uri: item.flower_products.product_image_url }} style={{ width: 90, height: 90, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }} />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={{ color: '#333', fontSize: 18, fontWeight: 'bold' }}>{item.flower_products.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Text style={{ color: '#ff6347', fontSize: 16, fontWeight: '600' }}>₹{item.flower_products.price}</Text>
                          <Text style={{ color: '#888', fontSize: 14, marginLeft: 8 }}>({item.flower_products.duration} Month)</Text>
                        </View>
                        <Text style={{ color: '#666', fontSize: 14 }}>Order Id: <Text style={{ color: '#000' }}>{item.order_id}</Text></Text>
                        {item?.status === "pending" && (
                          <Text style={{ color: '#000', fontSize: 15, fontWeight: 'bold' }}>
                            Your subscription will start on {moment(item.start_date).format('MMM Do YYYY')}
                          </Text>
                        )}
                        {item?.status === "active" && (
                          item.pause_start_date ? (
                            <TouchableOpacity
                              onPress={() => handlePauseButton(item.order_id)}
                              style={{ backgroundColor: '#e6ab2c', width: 80, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, marginTop: 8 }}
                            >
                              <Text style={{ color: '#fff' }}>Edit Pause</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handlePauseButton(item.order_id)}
                              style={{ backgroundColor: '#1cd638', width: 70, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, marginTop: 8 }}
                            >
                              <Text style={{ color: '#fff' }}>Pause</Text>
                            </TouchableOpacity>
                          )
                        )}
                        {item?.status === "paused" && (
                          <TouchableOpacity
                            onPress={() => handleResumeButton(item)}
                            style={{ backgroundColor: 'green', width: 70, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, marginTop: 8, marginLeft: 10 }}
                          >
                            <Text style={{ color: '#fff' }}>Resume</Text>
                          </TouchableOpacity>
                        )}
                        {item?.status === "expired" && (
                          <View
                            style={{ backgroundColor: '#e8090d', width: 70, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, marginTop: 8 }}
                          >
                            <Text style={{ color: '#fff' }}>Expired</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
              :
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 300 }}>
                <Text style={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>No Package Found</Text>
              </View>
            }
          </ScrollView>
        }
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isPauseModalVisible}
        onRequestClose={closePauseModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 10 }}>
            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={closePauseModal}>
              <Feather name="x" color={'#000'} size={30} />
            </TouchableOpacity>
            <Text style={styles.label}>Pause Start Time</Text>
            <TouchableOpacity onPress={openStartDatePicker}>
              <TextInput
                style={styles.input}
                value={startDate.toLocaleDateString()}
                editable={false}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Pause End Time</Text>
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
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isStartDateModalOpen}
        onRequestClose={closeStartDatePicker}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
            <Calendar
              onDayPress={handleStartDatePress}
              markedDates={{
                [moment(startDate).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue'
                }
              }}
              minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEndDateModalOpen}
        onRequestClose={closeEndDatePicker}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
            <Calendar
              onDayPress={handleEndDatePress}
              markedDates={{
                [moment(endDate).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue'
                }
              }}
              minDate={moment().add(1, 'days').format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isResumeModalVisible}
        onRequestClose={closeResumeModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 10 }}>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={isResumeDateModalOpen}
        onRequestClose={closeResumeDatePicker}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
            <Calendar
              onDayPress={handleResumDatePress}
              markedDates={{
                [moment(resumeDate).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue'
                }
              }}
              minDate={moment(pause_start_date).format('YYYY-MM-DD')}
              maxDate={moment(pause_end_date).format('YYYY-MM-DD')}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  mainView: {
    flex: 1,
    paddingBottom: 25
  },
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
  heroContent: {
    // marginTop: 10,
  },
  heroTitle: {
    fontSize: 28,
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
  // Section Styles
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
})