import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    BackHandler,
    Modal,
    TextInput,
    StatusBar,
    ToastAndroid,
    Share,
    Linking,
    RefreshControl,
    Alert,
    ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTab } from '../TabContext';
import { base_url } from '../../../App';
import ProfileImgMenu from '../../component/ProfileImgMenu';
import ShowDP from '../../component/ShowDP';
import moment from 'moment';

const PROFILE_OPTIONS = [
    { id: '1', title: 'My Orders', icon: 'clock', subtitle: 'Track your pooja flower deliveries', gradient: ['#FF6B35', '#F7931E'], page: 'MyOrder' },
    { id: '2', title: 'Delivery Address', icon: 'map-marker-alt', subtitle: 'Home temple delivery location', gradient: ['#10B981', '#059669'], page: 'Address' },
    { id: '6', title: 'Help & Support', icon: 'question-circle', subtitle: 'Get help with flower selection', gradient: ['#06B6D4', '#0891B2'], page: 'HelpAndSupport' },
    { id: '3', title: 'About us', icon: 'info-circle', subtitle: 'Learn more about our mission', gradient: ['#EF4444', '#DC2626'], page: 'AboutUs' },
    { id: '4', title: 'Terms & Conditions', icon: 'file-alt', subtitle: 'Read our terms of service', gradient: ['#8B5CF6', '#A855F7'], page: 'TermsAndConditions' },
    { id: '5', title: 'Privacy Policy', icon: 'shield-alt', subtitle: 'Your data privacy matters', gradient: ['#F59E0B', '#D97706'], page: 'PrivacyPolicy' },
];

const NewProfile = () => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const { setActiveTab } = useTab();
    const [spinner, setSpinner] = useState(false);
    const [profileDetails, setProfileDetails] = useState({});
    const [isFocus, setIsFocus] = useState(false);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState(new Date());
    const [about, setAbout] = useState('');
    const [gender, setGender] = useState(false);
    const [genderID, setGenderID] = useState(null);
    const [genderitems, setGenderItems] = useState([
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
        { label: 'Prefer not to disclose', value: 'Prefer_not_to_disclose' }
    ]);
    const [imageSource, setImageSource] = useState(null);

    const [profileModal, setProfileModal] = useState(false);
    const closeProfileModal = () => { setProfileModal(false); }
    const [updateProfileErrorVisible, setUpdateProfileErrorVisible] = useState(false);
    const [updateProfileError, setUpdateProfileError] = useState('');
    const [profileImgMenu, setProfileImgMenu] = useState(false);
    const [showProfileImage, setShowProfileImage] = useState(false);

    const [canDelete, setCanDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const checkDeleteFlag = async () => {
        try {
            const token = await AsyncStorage.getItem('storeAccesstoken');
            const res = await fetch(`${base_url}api/say-yes`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const j = await res.json();
            // treat "yes" (any case) as true
            const value = String(j?.response || '').toLowerCase() === 'yes';
            setCanDelete(value);
        } catch (e) {
            setCanDelete(false); // fail closed (hide button)
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            'Delete account?',
            'This will remove your personal data and sign you out.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete },
            ],
        );
    };

    const performDelete = async () => {
        try {
            setDeleting(true);
            const token = await AsyncStorage.getItem('storeAccesstoken');
            const res = await fetch(`${base_url}api/users-delet`, {   // <-- use your exact path
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const j = await res.json().catch(() => ({}));

            if (res.ok && (j?.success ?? true)) {
                Alert.alert('Deleted', j?.message || 'Your account has been deleted.');
                await AsyncStorage.clear();
                navigation.reset({ index: 0, routes: [{ name: 'NewLogin' }] });
            } else {
                Alert.alert('Delete failed', j?.message || 'Please try again.');
            }
        } catch (e) {
            Alert.alert('Network error', 'Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(async () => {
            setRefreshing(false);
            await getProfile();
            await getReferralCode();
            console.log("Refreshing Successful");
        }, 2000);
    }, []);

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
                setDob(responseData?.user?.dob);
                setGenderID(responseData?.user?.gender);
                setImageSource(responseData?.user?.userphoto);
            }
        } catch (error) {
            console.log(error);
            setSpinner(false);
        }
    }

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

    const EditProfile = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');
        if (!name) {
            setUpdateProfileErrorVisible(true);
            setUpdateProfileError('Enter Your Name');
            setTimeout(() => {
                setUpdateProfileErrorVisible(false);
            }, 5000);
            return;
        }
        if (!email) {
            setUpdateProfileErrorVisible(true);
            setUpdateProfileError('Enter Your Email');
            setTimeout(() => {
                setUpdateProfileErrorVisible(false);
            }, 5000);
            return;
        }
        if (genderID === null) {
            setUpdateProfileErrorVisible(true);
            setUpdateProfileError('Select Your Gender');
            setTimeout(() => {
                setUpdateProfileErrorVisible(false);
            }, 5000);
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('gender', genderID);
        formData.append('about', about);
        if (dob) formData.append('dob', dob);

        try {
            const response = await fetch(base_url + 'api/update-profile', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: formData,
            });
            const responseData = await response.json();
            console.log("responseData", responseData);
            if (response.ok) {
                console.log("Profile Updated successfully");
                closeProfileModal();
                getProfile();
            } else {
                console.error('Failed to Edit Profile:', responseData.message);
            }
        } catch (error) {
            console.log("Error when Edit Profile:", error);
        }
    }

    const removeProfilePhoto = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');
        if (!imageSource) {
            ToastAndroid.show('Profile photo not available', ToastAndroid.SHORT);
        } else {
            try {
                const response = await fetch(base_url + 'api/deletePhoto', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                });
                const responseData = await response.json();
                // console.log("responseData", responseData);
                if (response.ok) {
                    // console.log("Profile Photo Remove successfully");
                    setImageSource(null);
                    setProfileImgMenu(false);
                    closeProfileModal();
                    getProfile();
                } else {
                    console.error('Failed to Remove Profile Photo:', responseData.message);
                }
            } catch (error) {
                console.log("Error when Remove Profile Photo:", error);
            }
        }
    }

    const selectImage = async () => {
        var access_token = await AsyncStorage.getItem('storeAccesstoken');
        const options = {
            title: 'Select Image',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                const source = response.assets[0].uri
                setImageSource(source);
                // console.log("selected image-=-=", response.assets[0])

                let imageBody = new FormData();
                imageBody.append('userphoto',
                    {
                        uri: response.assets[0].uri,
                        name: response.assets[0].fileName,
                        filename: response.assets[0].fileName,
                        type: response.assets[0].type
                    });

                fetch(base_url + 'api/update-userphoto',
                    {
                        method: 'POST',
                        headers: {
                            "Content-Type": "multipart/form-data",
                            'Authorization': `Bearer ${access_token}`
                        },
                        body: imageBody
                    })
                    .then((response) => response.json())
                    .then(async (responseData) => {
                        console.log("Profile-picture Update----", responseData);
                    })
                    .catch((error) => {
                        console.error('There was a problem with the fetch operation:', error);
                    });
            }
        });
    };

    const viewProfileImage = () => {
        // console.log("imageSource", imageSource);
        if (!imageSource) {
            ToastAndroid.show('Profile photo not available', ToastAndroid.SHORT);
        } else {
            setShowProfileImage(true);
        }
    }

    const [referralCode, setReferralCode] = useState(null);

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
            console.log('WhatsApp open error:', e);
        }
    };

    useEffect(() => {
        if (isFocused) {
            getProfile();
            getReferralCode();
            checkDeleteFlag();
        }
    }, [isFocused]);

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <ProfileImgMenu isVisible={profileImgMenu} onClose={() => setProfileImgMenu(false)} selectImage={selectImage} showProfileImage={viewProfileImage} removeProfilePhoto={removeProfilePhoto} />
            <ShowDP showProfileImage={showProfileImage} onClose={() => setShowProfileImage(false)} imageSource={imageSource} />
            <View style={{ flex: 1 }}>
                <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                    <View style={styles.heroContent}>
                        <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
                            <Text style={styles.heroTitle}>My Profile</Text>
                        </TouchableOpacity>
                        <Text style={styles.heroSubtitle}>
                            Manage your sacred flower journey
                        </Text>
                    </View>
                </LinearGradient>
                <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={{ flex: 1 }}>
                    {spinner ?
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                            <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
                        </View>
                        :
                        <View style={styles.profileCard}>
                            {/* Avatar */}
                            {imageSource ? (
                                <Image source={{ uri: imageSource }} style={styles.avatar} />
                            ) : (
                                <Image source={require('../../assets/images/user.png')} style={styles.avatar} />
                            )}

                            {/* User Info */}
                            <View style={styles.userInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {profileDetails?.name && (
                                        <Text style={styles.userName}>{profileDetails?.name}</Text>
                                    )}
                                    {profileDetails?.email && !profileDetails?.name && (
                                        <Text style={styles.userName}>{profileDetails?.email}</Text>
                                    )}
                                    {profileDetails?.mobile_number && !profileDetails?.email && !profileDetails?.name && (
                                        <Text style={styles.userName}>{profileDetails?.mobile_number}</Text>
                                    )}
                                    <Feather name="check-circle" color={'#28a745'} size={16} style={{ marginLeft: 4 }} />
                                </View>

                                {profileDetails?.email && profileDetails?.name && (
                                    <Text style={styles.userEmail}>{profileDetails?.email}</Text>
                                )}
                                {profileDetails?.mobile_number && profileDetails?.email && profileDetails?.name && (
                                    <Text style={styles.userEmail}>{profileDetails?.mobile_number}</Text>
                                )}
                            </View>

                            {/* Edit Icon */}
                            <TouchableOpacity onPress={() => setProfileModal(true)} style={styles.editIconBtn}>
                                <Feather name="edit" size={25} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    }

                    {/* <View style={styles.statsContainer}>
                        <View style={styles.statBox}><Text style={styles.statNum}>180</Text><Text style={styles.statLabel}>Orders</Text></View>
                        <View style={styles.statBox}><Text style={styles.statNum}>12</Text><Text style={styles.statLabel}>Favorites</Text></View>
                        <View style={styles.statBox}><Text style={styles.statNum}>₹2,400</Text><Text style={styles.statLabel}>Saved</Text></View>
                    </View> */}

                    <View style={styles.optionsContainer}>
                        {PROFILE_OPTIONS.map(option => (
                            <TouchableOpacity key={option.id} style={styles.optionCard} onPress={() => navigation.navigate(option.page)}>
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

                    {/* Refer & Earn (below Address) */}
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

                    {/* Delete Account Button */}
                    {canDelete && (
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={confirmDelete}
                            disabled={deleting}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#FFE5E5', '#FFB8B8']} style={styles.logoutGradient}>
                                {deleting ? (
                                    <ActivityIndicator />
                                ) : (
                                    <>
                                        <Icon name="trash-alt" size={20} color="#EF4444" />
                                        <Text style={styles.logoutText}>Delete Account</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Edit Profile Modal */}
            <Modal
                visible={profileModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setProfileModal(false)}
            >
                <View style={styles.fmContainer}>
                    <StatusBar barStyle="light-content" backgroundColor="#334155" />

                    {/* Header */}
                    <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.fmHeader}>
                        <TouchableOpacity onPress={() => setProfileModal(false)} style={styles.fmBackBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Feather name="arrow-left" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.fmHeaderTitle}>Edit Profile</Text>
                        <View style={{ width: 22 }} />
                    </LinearGradient>

                    {/* Body */}
                    <ScrollView
                        style={styles.fmBody}
                        contentContainerStyle={styles.fmBodyContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Avatar */}
                        <View style={styles.fmAvatarWrap}>
                            <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.fmAvatarRing}>
                                <TouchableOpacity onPress={() => setProfileImgMenu(true)} style={styles.fmAvatar}>
                                    {imageSource ? (
                                        <Image source={{ uri: imageSource }} style={styles.fmAvatarImg} />
                                    ) : (
                                        <Image source={require('../../assets/images/user.png')} style={styles.fmAvatarImg} />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setProfileImgMenu(true)} style={styles.fmAvatarEdit} activeOpacity={0.9}>
                                    <Feather name="edit-2" size={14} color="#fff" />
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>

                        {/* Error banner */}
                        {updateProfileErrorVisible ? (
                            <View style={styles.fmError}>
                                <Feather name="alert-triangle" size={16} color="#991B1B" />
                                <Text style={styles.fmErrorText}>{updateProfileError}</Text>
                            </View>
                        ) : null}

                        {/* Name */}
                        <Text style={styles.fmLabel}>Full Name</Text>
                        <View style={styles.fmField}>
                            <Feather name="user" size={18} color="#64748B" style={styles.fmIcon} />
                            <TextInput
                                style={styles.fmInput}
                                placeholder="Enter your name"
                                placeholderTextColor="#94A3B8"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Phone (read-only) */}
                        <Text style={styles.fmLabel}>Phone Number</Text>
                        <View style={[styles.fmField, styles.fmFieldDisabled]}>
                            <Feather name="phone" size={18} color="#94A3B8" style={styles.fmIcon} />
                            <TextInput style={[styles.fmInput, styles.fmInputDisabled]} value={phoneNumber} editable={false} />
                        </View>

                        {/* Email */}
                        <Text style={styles.fmLabel}>Email</Text>
                        <View style={styles.fmField}>
                            <Feather name="mail" size={18} color="#64748B" style={styles.fmIcon} />
                            <TextInput
                                style={styles.fmInput}
                                placeholder="you@example.com"
                                placeholderTextColor="#94A3B8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* DOB (read-only like your current flow) */}
                        <Text style={styles.fmLabel}>Date of Birth</Text>
                        <View style={[styles.fmField, styles.fmFieldDisabled]}>
                            <Feather name="calendar" size={18} color="#94A3B8" style={styles.fmIcon} />
                            <TextInput
                                style={[styles.fmInput, styles.fmInputDisabled]}
                                value={dob ? moment(dob, 'YYYY-MM-DD').format('DD MMM YYYY') : ''}
                                editable={false}
                                placeholder="Select Date of Birth"
                                placeholderTextColor="#b7b7c2"
                            />
                        </View>

                        {/* Gender (DropDownPicker) */}
                        <Text style={[styles.fmLabel, { marginBottom: 4 }]}>Gender</Text>
                        <View style={{ zIndex: 1000, marginBottom: 14 }}>
                            <DropDownPicker
                                open={gender}
                                value={genderID}
                                items={genderitems}
                                setOpen={setGender}
                                setValue={setGenderID}
                                setItems={setGenderItems}
                                placeholder="Select gender"
                                listMode="SCROLLVIEW"
                                style={styles.fmDD}
                                dropDownContainerStyle={styles.fmDDContainer}
                                textStyle={{ fontWeight: '700', color: '#0f172a' }}
                                placeholderStyle={{ color: '#94A3B8', fontWeight: '600' }}
                                itemSeparator
                            />
                        </View>

                        {/* About */}
                        <Text style={styles.fmLabel}>About Yourself</Text>
                        <View style={[styles.fmField, { height: 110, alignItems: 'flex-start', paddingVertical: 10 }]}>
                            <Feather name="message-circle" size={18} color="#64748B" style={[styles.fmIcon, { marginTop: 4 }]} />
                            <TextInput
                                style={[styles.fmInput, { height: '100%', textAlignVertical: 'top' }]}
                                placeholder="A few lines about you"
                                placeholderTextColor="#94A3B8"
                                value={about}
                                onChangeText={setAbout}
                                multiline
                            />
                        </View>

                        <View style={{ height: 90 }} />
                    </ScrollView>

                    {/* Sticky Footer */}
                    <View style={styles.fmFooter}>
                        <TouchableOpacity onPress={() => setProfileModal(false)} style={styles.fmCancelBtn} activeOpacity={0.9}>
                            <Text style={styles.fmCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={EditProfile} style={styles.fmSaveBtn} activeOpacity={0.9}>
                            <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.fmSaveGrad}>
                                <Text style={styles.fmSaveText}>Save</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        margin: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 20,
        marginRight: 14,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '600',
    },
    userEmail: {
        color: '#6B7280',
        fontSize: 13,
        marginTop: 2,
    },
    editIconBtn: {
        padding: 8,
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
        marginHorizontal: 20,
        margin: 10,
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
    // Modal styles
    fmContainer: { flex: 1, backgroundColor: '#FFFFFF' },

    /* Header */
    fmHeader: {
        paddingTop: 24,      // safe-ish for most devices
        paddingBottom: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fmBackBtn: { position: 'absolute', left: 16, bottom: 14 },
    fmHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },

    /* Body */
    fmBody: { flex: 1 },
    fmBodyContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 0 },

    /* Avatar */
    fmAvatarWrap: { alignItems: 'center', marginBottom: 10, marginTop: 4 },
    fmAvatarRing: {
        width: 116, height: 116, borderRadius: 58, padding: 3,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#F97316', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    fmAvatar: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', backgroundColor: '#F1F5F9' },
    fmAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    fmAvatarEdit: {
        position: 'absolute', right: -4, bottom: 16,
        backgroundColor: '#ff4d00ff', padding: 8, borderRadius: 16, elevation: 3,
    },

    /* Error banner */
    fmError: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1,
        paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 12,
    },
    fmErrorText: { color: '#991B1B', fontWeight: '800', flex: 1 },

    /* Fields */
    fmLabel: { color: '#0f172a', fontWeight: '800', marginTop: 6, marginBottom: 6 },
    fmField: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB',
        paddingHorizontal: 12, height: 54, marginBottom: 10,
    },
    fmIcon: { marginRight: 10 },
    fmInput: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '700' },
    fmFieldDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
    fmInputDisabled: { color: '#6B7280', fontWeight: '700' },

    /* DropDownPicker */
    fmDD: {
        borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
        borderRadius: 14, minHeight: 54,
    },
    fmDDContainer: {
        borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff', borderRadius: 14,
    },

    /* Footer */
    fmFooter: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        flexDirection: 'row', gap: 10,
    },
    fmCancelBtn: {
        flex: 1, height: 48, borderRadius: 14,
        borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    },
    fmCancelText: { color: '#334155', fontWeight: '900' },
    fmSaveBtn: { flex: 1, height: 48, borderRadius: 14, overflow: 'hidden' },
    fmSaveGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    fmSaveText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

    // Refer & earn style
    referralWrap: {
        paddingHorizontal: 20,
        marginTop: 6,
        marginBottom: 12,
    },
    referralCard: {
        borderRadius: 20,
        padding: 16,
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
    refTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#7C2D12',
        marginTop: 12,
    },
    seeStatus: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
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
        backgroundColor: 'rgba(255,255,255,0.85)',
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
});
