import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTab } from '../TabContext';
import { base_url } from '../../../App';

const PROFILE_OPTIONS = [
    { id: '1', title: 'My Orders', icon: 'clock', subtitle: 'Track your pooja flower deliveries', gradient: ['#FF6B35', '#F7931E'] },
    { id: '2', title: 'Delivery Address', icon: 'map-marker-alt', subtitle: 'Home temple delivery location', gradient: ['#10B981', '#059669'] },
    { id: '6', title: 'Help & Support', icon: 'question-circle', subtitle: 'Get help with flower selection', gradient: ['#06B6D4', '#0891B2'] },
    { id: '3', title: 'About us', icon: 'info-circle', subtitle: 'Learn more about our mission', gradient: ['#EF4444', '#DC2626'] },
    { id: '4', title: 'Terms & Conditions', icon: 'file-alt', subtitle: 'Read our terms of service', gradient: ['#8B5CF6', '#A855F7'] },
    { id: '5', title: 'Privacy Policy', icon: 'shield-alt', subtitle: 'Your data privacy matters', gradient: ['#F59E0B', '#D97706'] },
];

const NewProfile = () => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { setActiveTab } = useTab();
    const [spinner, setSpinner] = useState(false);
    const [profileDetails, setProfileDetails] = useState({});
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [about, setAbout] = useState('');
    const [gender, setGender] = useState('');
    const [genderID, setGenderID] = useState(null);
    const [genderitems, setGenderItems] = useState([
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
        { label: 'Prefer not to disclose', value: 'Prefer_not_to_disclose' }
    ]);
    const [imageSource, setImageSource] = useState(null);

    const getProfile = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');
        try {
            setSpinner(true);
            const response = await fetch(base_url + 'api/user/details', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
            });
            const responseData = await response.json();
            // console.log("getProfile-------", responseData);
            if (responseData.success === true) {
                // console.log("getProfile-------", responseData?.user?.userphoto);
                setSpinner(false);
                setProfileDetails(responseData.user);
                setName(responseData?.user?.name);
                setPhoneNumber(responseData?.user?.mobile_number);
                setEmail(responseData?.user?.email);
                setAbout(responseData?.user?.about);
                // setDOB(responseData?.user?.dob);
                setGenderID(responseData?.user?.gender);
                setImageSource(responseData?.user?.userphoto);
            }
        } catch (error) {
            console.log(error);
            setSpinner(false);
        }
    }

    useEffect(() => {
        if (isFocused) {
            getProfile();
        }
    }, [isFocused]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                    <View style={styles.heroContent}>
                        <TouchableOpacity style={styles.headerRow} onPress={() => setActiveTab('home')}>
                            <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
                            <Text style={styles.heroTitle}>My Profile</Text>
                        </TouchableOpacity>
                        <Text style={styles.heroSubtitle}>
                            Manage your sacred flower journey
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.profileCard}>
                    {imageSource ?
                        <Image
                            source={{ uri: imageSource }}
                            style={styles.avatar}
                        />
                        :
                        <Icon name="user-circle" size={80} color="#9CA3AF" style={styles.avatar} />
                    }
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Priya Patel</Text>
                        <Text style={styles.userEmail}>priya.patel@example.com</Text>
                    </View>
                </View>

                {/* <View style={styles.statsContainer}>
                    <View style={styles.statBox}><Text style={styles.statNum}>180</Text><Text style={styles.statLabel}>Orders</Text></View>
                    <View style={styles.statBox}><Text style={styles.statNum}>12</Text><Text style={styles.statLabel}>Favorites</Text></View>
                    <View style={styles.statBox}><Text style={styles.statNum}>₹2,400</Text><Text style={styles.statLabel}>Saved</Text></View>
                </View> */}

                <View style={styles.optionsContainer}>
                    {PROFILE_OPTIONS.map(option => (
                        <TouchableOpacity key={option.id} style={styles.optionCard}>
                            <LinearGradient colors={option.gradient} style={styles.iconContainer}>
                                <Icon name={option.icon} size={20} color="#fff" />
                            </LinearGradient>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                            </View>
                            <Icon name="chevron-right" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Premium Upgrade Card */}
                {/* <View style={styles.upgradeContainer}>
                    <LinearGradient
                        colors={['#8B5CF6', '#A855F7', '#C084FC']}
                        style={styles.upgradeGradient}
                    >
                        <View style={styles.upgradeContent}>
                            <Icon name="crown" size={40} color="#fff" />
                            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                            <Text style={styles.upgradeSubtitle}>Get exclusive flowers and priority delivery</Text>
                            <TouchableOpacity style={styles.upgradeButton}>
                                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View> */}

                {/* Enhanced Logout Button */}
                <TouchableOpacity style={styles.logoutButton}>
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        style={styles.logoutGradient}
                    >
                        <Icon name="sign-out-alt" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default NewProfile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        paddingTop: 40,
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 10,
    },
    backIcon: {
        position: 'absolute',
        left: 0,
    },
    heroContent: {
        // marginTop: 10
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
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginRight: 16
    },
    userInfo: {},
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280'
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginBottom: 20
    },
    statBox: {
        alignItems: 'center'
    },
    statNum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280'
    },
    optionsContainer: {
        paddingHorizontal: 20
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    optionTextContainer: {
        flex: 1
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },
    optionSubtitle: {
        fontSize: 12,
        color: '#6B7280'
    },
    upgradeContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    upgradeGradient: {
        padding: 24,
        alignItems: 'center',
    },
    upgradeContent: {
        alignItems: 'center',
    },
    upgradeTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 12,
        marginBottom: 8,
    },
    upgradeSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 0.9,
        marginBottom: 20,
    },
    upgradeButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    upgradeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    logoutButton: {
        // marginHorizontal: 20,
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderWidth: 2,
        borderColor: '#FFE5E5',
    },
    logoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#EF4444',
        marginLeft: 12,
    },
});
