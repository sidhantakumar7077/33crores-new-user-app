import { StyleSheet, Text, View, Modal, Button, TouchableWithoutFeedback, TouchableOpacity, Alert, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
// import { base_url } from '../../App';

const Drawer = ({ visible, onClose }) => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [accessToken, setAccessToken] = useState(null);
    const [appVersion, setAppVersion] = useState('');

    const getAccesstoken = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');
        console.log("access_token=-=-", access_token);
        setAccessToken(access_token);
    }

    // Fetch App Version
    useEffect(() => {
        const fetchVersion = async () => {
            const version = await DeviceInfo.getVersion();
            setAppVersion(version);
        };

        fetchVersion();
    }, []);

    useEffect(() => {
        if (isFocused) {
            getAccesstoken();
        }
    }, [isFocused])

    const goToProfile = () => {
        if (accessToken) {
            onClose();
            navigation.navigate('NewProfile');
        } else {
            onClose();
            navigation.navigate('Login');
        }
    }

    const goToNotifications = () => {
        if (accessToken) {
            onClose();
            navigation.navigate('Notificationpage');
        } else {
            onClose();
            navigation.navigate('Login');
        }
    }

    const goToMyOrders = () => {
        if (accessToken) {
            onClose();
            navigation.navigate('MyOrder');
        } else {
            onClose();
            navigation.navigate('Login');
        }
    }

    const goToAddress = () => {
        if (accessToken) {
            onClose();
            navigation.navigate('Address');
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

                                    <TouchableOpacity onPress={goToNotifications} style={styles.menuItem}>
                                        <Ionicons name="notifications-outline" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Notifications</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={goToMyOrders} style={styles.menuItem}>
                                        <Ionicons name="cart-outline" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>My Orders</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={goToAddress} style={styles.menuItem}>
                                        <Entypo name="location" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Address</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('HelpAndSupport'); onClose(); }}>
                                        <FontAwesome5 name="question-circle" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Help & Support</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('AboutUs'); onClose(); }}>
                                        <FontAwesome5 name="info-circle" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>About us</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('TermsAndConditions'); onClose(); }}>
                                        <FontAwesome5 name="file-alt" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Terms & Conditions</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('PrivacyPolicy'); onClose(); }}>
                                        <FontAwesome5 name="shield-alt" color="#fff" size={20} />
                                        <Text style={styles.menuLabel}>Privacy Policy</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Show current version */}
                                <View style={styles.footerSection}>
                                    <Text style={styles.versionLabel}>Version {appVersion}</Text>
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
    versionLabel: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        opacity: 0.7,
    },
})