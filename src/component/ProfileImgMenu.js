import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import Modal from 'react-native-modal';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const ProfileImgMenu = ({ isVisible, onClose, selectImage, showProfileImage, removeProfilePhoto }) => {
    const translateY = useRef(new Animated.Value(400)).current;

    const slideIn = () => {
        Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const slideOut = () => {
        Animated.timing(translateY, {
            toValue: 400,
            duration: 300,
            useNativeDriver: true,
        }).start(onClose);
    };

    React.useEffect(() => {
        if (isVisible) {
            slideIn();
        } else {
            slideOut();
        }
    }, [isVisible]);

    return (
        <Modal
            isVisible={isVisible}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.5}
            onBackdropPress={slideOut}
            onSwipeComplete={slideOut}
            swipeDirection={['down']}
            style={styles.modal}
        >
            <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
                <View style={{ width: 80, height: 5, backgroundColor: '#8c8c8b', alignSelf: 'center', marginTop: 5, borderRadius: 10 }}></View>
                <View style={{ width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                    <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>Profile Image</Text>
                    <TouchableOpacity onPress={slideOut}>
                        <Entypo name="cross" color={'#000'} size={27} />
                    </TouchableOpacity>
                </View>
                <View style={{ marginTop: 20, width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => { selectImage(); slideOut(); }} style={{ alignItems: 'center' }}>
                        <View style={{ width: 45, height: 45, borderColor: '#ffcb44', borderWidth: 2, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="image" color={'#000'} size={27} />
                        </View>
                        <Text style={{ color: '#737370', fontWeight: '500', marginTop: 5 }}>Gallery</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={{ alignItems: 'center' }}>
                        <View style={{ width: 45, height: 45, borderColor: '#ffcb44', borderWidth: 2, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                            <Image style={{ width: 28, height: 28 }} source={require('../assets/images/avatar.png')} />
                        </View>
                        <Text style={{ color: '#737370', fontWeight: '500', marginTop: 5 }}>Avatar</Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity onPress={() => { showProfileImage(); slideOut(); }} style={{ alignItems: 'center' }}>
                        <View style={{ width: 45, height: 45, borderColor: '#ffcb44', borderWidth: 2, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                            <Entypo name="folder-images" color={'#000'} size={27} />
                        </View>
                        <Text style={{ color: '#737370', fontWeight: '500', marginTop: 5 }}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={removeProfilePhoto} style={{ alignItems: 'center' }}>
                        <View style={{ width: 45, height: 45, borderColor: '#ffcb44', borderWidth: 2, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="delete" color={'#000'} size={27} />
                        </View>
                        <Text style={{ color: '#737370', fontWeight: '500', marginTop: 5 }}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    content: {
        backgroundColor: 'white',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'flex-end',
    },
    closeButton: {
        fontSize: 18,
        color: 'blue',
    },
    body: {
        paddingVertical: 20,
    },
});

export default ProfileImgMenu;
