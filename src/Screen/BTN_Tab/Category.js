import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    BackHandler
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTab } from '../TabContext';

const CATEGORIES = [
    {
        id: '1',
        name: 'Marigold (Genda)',
        image: 'https://images.pexels.com/photos/1068791/pexels-photo-1068791.jpeg',
        count: '15 varieties',
        gradient: ['#FF6B35', '#F7931E'],
        description: 'Sacred golden flowers for Lord Ganesha',
    },
    {
        id: '2',
        name: 'Jasmine (Jui)',
        image: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg',
        count: '8 varieties',
        gradient: ['#8B5CF6', '#A855F7'],
        description: 'Pure white flowers for Goddess Lakshmi',
    },
    {
        id: '3',
        name: 'Lotus (Padma)',
        image: 'https://images.pexels.com/photos/68507/spring-flowers-flowers-collage-floral-68507.jpeg',
        count: '6 varieties',
        gradient: ['#10B981', '#059669'],
        description: 'Divine flowers for Lord Vishnu',
    },
    {
        id: '4',
        name: 'Hibiscus (Japa)',
        image: 'https://images.pexels.com/photos/33045/sunflower-sun-summer-yellow.jpg',
        count: '10 varieties',
        gradient: ['#F59E0B', '#D97706'],
        description: 'Red flowers for Goddess Durga',
    },
    {
        id: '5',
        name: 'Rose (Gulab)',
        image: 'https://images.pexels.com/photos/53141/orchids-purple-plant-flower-53141.jpeg',
        count: '12 varieties',
        gradient: ['#EF4444', '#DC2626'],
        description: 'Fragrant flowers for all deities',
    },
    {
        id: '6',
        name: 'Tulsi Leaves',
        image: 'https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg',
        count: '5 varieties',
        gradient: ['#06B6D4', '#0891B2'],
        description: 'Sacred leaves for Lord Krishna',
    },
];

const Category = () => {

    const navigation = useNavigation();
    const { setActiveTab } = useTab();
    const [selectedFilter, setSelectedFilter] = useState('all');

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                    <View style={styles.heroContent}>
                        <TouchableOpacity style={styles.headerRow} onPress={() => setActiveTab('home')}>
                            <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
                            <Text style={styles.heroTitle}>Sacred Categories</Text>
                        </TouchableOpacity>
                        <Text style={styles.heroSubtitle}>
                            Choose flowers according to your deity and ritual traditions
                        </Text>
                    </View>
                </LinearGradient>

                {/* Categories Grid */}
                <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>🏷️ Sacred Flower Collections</Text>
                    <View style={styles.categoriesGrid}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity key={category.id} style={styles.categoryCard}>
                                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                                <LinearGradient
                                    colors={[...category.gradient, 'rgba(0,0,0,0.4)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.categoryOverlay}
                                >
                                    <View style={styles.categoryContent}>
                                        <View style={styles.categoryHeader}>
                                            <Text style={styles.categoryName}>{category.name}</Text>
                                            <View style={styles.categoryBadge}>
                                                <Icon name="star" size={12} color="#FFFFFF" />
                                                <Text style={styles.categoryCount}>{category.count}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.categoryDescription}>{category.description}</Text>
                                        <TouchableOpacity style={styles.exploreButton}>
                                            <Icon name="search" size={14} color="#FFFFFF" />
                                            <Text style={styles.exploreButtonText}>Explore</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default Category;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    scrollView: {
        flex: 1
    },
    header: {
        paddingTop: 40,
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
    categoriesContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FF6B35',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    categoriesGrid: {
        paddingHorizontal: 20,
        gap: 16,
    },
    categoryCard: {
        height: 160,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 4,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        padding: 20,
    },
    categoryContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    categoryName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 10,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryCount: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 4,
    },
    categoryDescription: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginVertical: 8,
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    exploreButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 6,
    },
});
