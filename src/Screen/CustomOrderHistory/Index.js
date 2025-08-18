import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, FlatList, RefreshControl, TextInput, Modal, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { base_url } from '../../../App';

const Index = () => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [spinner, setSpinner] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [requested_orderList, setRequested_orderList] = useState([]);

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
            if (response.success) {
                // console.log("object", response.data);
                setRequested_orderList(response.data.requested_orders);
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

    useEffect(() => {
        if (isFocused) {
            getSubscriptionList();
        }
    }, [isFocused]);

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.mainView}>
                {/* Hero Header with Gradient */}
                <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                    <View style={styles.heroContent}>
                        <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
                            <Text style={styles.heroTitle}>Custom Order</Text>
                        </TouchableOpacity>
                        <Text style={styles.heroSubtitle}>
                            View your custom order history and details
                        </Text>
                    </View>
                </LinearGradient>

                {spinner === true ?
                    <View style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
                    </View>
                    :
                    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 10 }}>
                        {requested_orderList?.length > 0 ?
                            <View style={{ width: '95%', alignSelf: 'center', marginTop: 10 }}>
                                <FlatList
                                    data={requested_orderList}
                                    scrollEnabled={false}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate("CustomOrderDetailsPage", item)}
                                            style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6, overflow: 'hidden' }}
                                        >
                                            <Image source={{ uri: item.flower_product.product_image_url }} style={{ width: 90, height: 90, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }} />
                                            <View style={{ flex: 1, marginLeft: 15, justifyContent: 'center' }}>
                                                <Text style={{ color: '#333', fontSize: 18, fontWeight: 'bold' }}>{item.flower_product.name}</Text>
                                                <Text style={{ color: '#666', fontSize: 14 }}>Request Id: {item.request_id}</Text>
                                                {item?.status === 'pending' ?
                                                    <View style={{ backgroundColor: '#fae6e6', alignItems: 'center', justifyContent: 'center', padding: 3, borderRadius: 5, marginTop: 5 }}>
                                                        <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>Order has been placed.</Text>
                                                        <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>Cost will be notified in few minutes.</Text>
                                                    </View>
                                                    :
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 5 }}>
                                                        <View style={{ backgroundColor: '#fae6e6', alignItems: 'center', justifyContent: 'center', borderRadius: 5, width: 100, height: 30 }}>
                                                            <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>₹{item?.order?.total_price}</Text>
                                                        </View>
                                                        {item?.status === 'approved' &&
                                                            <TouchableOpacity onPress={() => navigation.navigate("CustomOrderDetailsPage", item)} style={{ backgroundColor: 'green', width: 70, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, marginLeft: 10 }}>
                                                                <Text style={{ color: '#fff' }}>Pay</Text>
                                                            </TouchableOpacity>
                                                        }
                                                    </View>
                                                }
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                            :
                            <View style={{ flex: 1, alignItems: 'center', paddingTop: 300 }}>
                                <Text style={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>No Request Found</Text>
                            </View>
                        }
                    </ScrollView>
                }
            </View>
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
        paddingBottom: 10
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
})