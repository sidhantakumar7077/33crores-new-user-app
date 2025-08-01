import { StyleSheet, Text, View, Modal, Button, TouchableWithoutFeedback, TouchableOpacity, Alert, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { base_url } from '../../App';
// import messaging from '@react-native-firebase/messaging';

const Drawer = ({ visible, onClose }) => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [accessToken, setAccessToken] = useState(null);
    const [fcmToken, setFcmToken] = useState(null);

    // async function getFCMToken() {
    //     try {
    //         const token = await messaging().getToken();
    //         // console.log('FCM Token:', token)
    //         setFcmToken(token);
    //     } catch (error) {
    //         console.log('Error getting FCM token:', error);
    //     }
    // }

    const confirmLogout = () => {
        onClose();
        try {
            fetch(base_url + 'api/userLogout', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    device_id: fcmToken,
                }),
            })
                .then((response) => response.json())
                .then(async (responseData) => {
                    if (responseData.status === 200) {
                        // console.log(responseData)
                        AsyncStorage.removeItem('storeAccesstoken');
                        navigation.replace('Home');
                    } else {
                        // console.log("Error-----", responseData.message);
                        alert(responseData.message);
                    }
                })
        } catch (error) {
            console.log("error", error)
        }
    };

    const isLogout = () => {
        onClose();
        Alert.alert('Confirm Logout', 'Are you sure you want to Logout ?', [
            { text: 'cancel' },
            { text: 'OK', onPress: confirmLogout },
        ]);
    };

    const getAccesstoken = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');
        console.log("access_token=-=-", access_token);
        setAccessToken(access_token);
    }

    useEffect(() => {
        if (isFocused) {
            // getFCMToken();
            getAccesstoken();
        }
    }, [isFocused])

    const goToProfile = () => {
        if (accessToken) {
            onClose();
            navigation.navigate('Profile');
        } else {
            onClose();
            navigation.navigate('Login');
        }
    }

    return (
        <View>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop}>
                        <TouchableWithoutFeedback>
                            <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.drawerContainer}>
                                {/* Header / Logo */}
                                <View style={styles.header}>
                                    <Image
                                        style={styles.logo}
                                        source={require('../assets/images/goldenLogo.png')}
                                    />
                                </View>

                                {/* Menu Options */}
                                <View style={styles.menuSection}>
                                    <TouchableOpacity onPress={goToProfile} style={styles.menuItem}>
                                        <Feather name="user" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Profile</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem}>
                                        <Ionicons name="notifications-outline" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Notifications</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem}>
                                        <Ionicons name="cart-outline" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>My Orders</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem}>
                                        <Entypo name="location" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Address</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Logout/Login */}
                                <View style={styles.footerSection}>
                                    {accessToken ? (
                                        <TouchableOpacity onPress={isLogout} style={styles.menuItem}>
                                            <MaterialCommunityIcons name="logout" color="#EF4444" size={20} />
                                            <Text style={[styles.menuLabel, { color: '#EF4444' }]}>Logout</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity onPress={() => { onClose(); navigation.navigate('Login'); }} style={styles.menuItem}>
                                            <MaterialCommunityIcons name="login" color="#0bdc97ff" size={20} />
                                            <Text style={[styles.menuLabel, { color: '#0bdc97ff' }]}>Login</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </LinearGradient>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    )
}

export default Drawer

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        flexDirection: 'row',
    },
    drawerContainer: {
        width: '75%',
        height: '100%',
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        elevation: 10,
    },
    header: {
        marginBottom: 10,
        alignItems: 'flex-start',
        // paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.26)',
    },
    logo: {
        width: 180,
        height: 80,
        resizeMode: 'contain',
    },
    menuSection: {
        flex: 1,
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    menuLabel: {
        marginLeft: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.26)',
        marginVertical: 10,
    },
    footerSection: {
        paddingBottom: 0,
    },
})