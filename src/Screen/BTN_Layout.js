import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    BackHandler,
    ToastAndroid,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTab } from './TabContext';

// Screens
import NewHome from './BTN_Tab/NewHome';
import Category from './BTN_Tab/Category';
import Subscribe from './BTN_Tab/Subscribe';
import NewProfile from './BTN_Tab/NewProfile';
import Notificationpage from '../Screen/Notificationpage/Index';

const BTN_Layout = () => {

    const backPressCount = useRef(0);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (backPressCount.current === 0) {
                    backPressCount.current += 1;
                    ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

                    setTimeout(() => {
                        backPressCount.current = 0;
                    }, 2000);

                    return true;
                } else {
                    BackHandler.exitApp();
                    return true;
                }
            };

            const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => backHandlerSubscription.remove();
        }, [])
    );

    const { activeTab, setActiveTab } = useTab();

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return <NewHome />;
            case 'category':
                return <Category />;
            case 'subscribe':
                return <Subscribe />;
            case 'Notificationpage':
                return <Notificationpage />;
            default:
                return <NewHome />;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <View style={styles.content}>{renderScreen()}</View>

            <View style={styles.tabBar}>
                <TabButton
                    label="Home"
                    icon="home"
                    isActive={activeTab === 'home'}
                    onPress={() => setActiveTab('home')}
                />
                <TabButton
                    label="Subscribe"
                    icon="calendar-alt"
                    isActive={activeTab === 'subscribe'}
                    onPress={() => setActiveTab('subscribe')}
                />
                <TabButton
                    label="Flowers"
                    icon="seedling"
                    isActive={activeTab === 'category'}
                    onPress={() => setActiveTab('category')}
                />
                <TabButton
                    label="Notification"
                    icon="bell"
                    isActive={activeTab === 'Notificationpage'}
                    onPress={() => setActiveTab('Notificationpage')}
                />
            </View>
        </SafeAreaView>
    );
};

const TabButton = ({ label, icon, isActive, onPress }) => (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
        <Icon name={icon} size={20} color={isActive ? '#f18204ff' : '#8E8E8E'} />
        <Text style={[styles.tabLabel, { color: isActive ? '#f18204ff' : '#8E8E8E' }]}>{label}</Text>
    </TouchableOpacity>
);

export default BTN_Layout;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // or your background color
    },
    content: {
        flex: 1,
        // paddingBottom: 60, // to avoid overlap with tab bar (optional if SafeAreaView works well)
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingHorizontal: 10,
    },
    tabButton: {
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
});
