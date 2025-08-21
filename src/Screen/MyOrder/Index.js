import React from 'react'
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native'
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Index = () => {

  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollView}>
        {/* Hero Header with Gradient */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>My Order</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              View your order history and details
            </Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Order Type</Text>

            <TouchableOpacity style={styles.planCard} onPress={() => navigation.navigate('SubscriptionOrderHistory')}>
              <View style={styles.iconContainer}>
                <Icon name="calendar-check" size={30} color="#FFF" />
              </View>
              <View style={styles.planTextContent}>
                <Text style={styles.planTitle}>Subscription Order</Text>
                <Text style={styles.planDescription}>
                  Receive fresh flowers at your doorstep every day.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.planCard} onPress={() => navigation.navigate('CustomOrderHistory')}>
              <View style={styles.iconContainer}>
                <Icon name="edit" size={30} color="#FFF" />
              </View>
              <View style={styles.planTextContent}>
                <Text style={styles.planTitle}>Custom Order</Text>
                <Text style={styles.planDescription}>
                  Choose flowers as per your unique preferences and occasions.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.planCard}
              onPress={() => navigation.navigate('ProductHistory')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                <Icon name="pray" size={30} color="#FFF" />
              </View>
              <View style={styles.planTextContent}>
                <Text style={styles.planTitle}>Puja Product Order</Text>
                <Text style={styles.planDescription}>
                  Browse purchased puja packs and items, and track their delivery status.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingBottom: 25
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 35,
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
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    paddingVertical: 40,
  },
  section: {
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  planTextContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
})