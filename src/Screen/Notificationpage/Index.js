import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, FlatList, RefreshControl, BackHandler } from 'react-native'
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { base_url } from '../../../App';
import { useTab } from '../TabContext';

const Index = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { setActiveTab } = useTab();
  const [allNotifications, setAllNotifications] = useState([]);
  const [spinner, setSpinner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      getAllNotifications();
      console.log("Refreshing Successful");
    }, 2000);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setActiveTab('home');
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  const getAllNotifications = async () => {
    try {
      setSpinner(true);
      const response = await fetch(base_url + 'api/fcm-bulk-notifications', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const responseData = await response.json();
      if (responseData.status === 200) {
        setAllNotifications(responseData.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      getAllNotifications();
    }
  }, [isFocused]);

  const formatNotificationTime = (createdAt) => {
    const now = moment();
    const notificationTime = moment(createdAt);

    const diffInMinutes = now.diff(notificationTime, 'minutes');
    const diffInHours = now.diff(notificationTime, 'hours');
    const diffInDays = now.diff(notificationTime, 'days');

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hr ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return notificationTime.format('DD/MM/YYYY');
    }
  };

  const renderNotificationCard = ({ item }) => {
    const cleanDescription = item.description
      ? item.description.replace(/(\r\n|\n|\r)/gm, ' ').trim()
      : '';

    const renderImageOrInitial = () => {
      if (item.image) {
        return <Image style={styles.avatarImage} source={{ uri: item.image }} />;
      }
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {item.title ? item.title.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.notificationCard}>
        {renderImageOrInitial()}
        <View style={styles.notificationTextArea}>
          <Text style={styles.titleText} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {cleanDescription}
          </Text>
          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={14} color="#888" />
            <Text style={styles.timeText}>{formatNotificationTime(item.created_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollView}>
        {/* Hero Header with Gradient */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow}
              onPress={() => {
                setActiveTab('home');
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
            >
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Notification</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              View your notifications and updates
            </Text>
          </View>
        </LinearGradient>

        {/* Notification List */}
        {spinner ?
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ffcb44" />
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
          :
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {allNotifications.length > 0 ? (
              <FlatList
                data={allNotifications}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={renderNotificationCard}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No Notification Found</Text>
              </View>
            )}
          </ScrollView>
        }
      </View>
    </SafeAreaView>
  )
}

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollView: {
    flex: 1,
    // paddingBottom: 10
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 300,
  },
  noDataText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  notificationTextArea: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 5,
  },
})