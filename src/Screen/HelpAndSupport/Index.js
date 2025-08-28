import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const ADDRESS_LINES = [
  '33Crores Pooja Products Pvt Ltd',
  '403, 4th Floor, O-Hub IDCO Sez Infocity,',
  'Bhubaneswar 751024, Odisha, Bharat',
];
const MAP_QUERY =
  '33Crores Pooja Products Pvt Ltd, 403, 4th Floor, O-Hub IDCO Sez Infocity, Bhubaneswar 751024, Odisha, Bharat';

const PHONE_DISPLAY = '(91)-9776-88888-7';
const PHONE_RAW = '+919776888887';
const EMAIL = 'contact@33crores.com';

const LINKS = {
  facebook: 'https://www.facebook.com/33crores',
  instagram: 'https://www.instagram.com/33crores',
  linkedin: 'https://www.linkedin.com/company/33crores',
};

const openURL = async (url) => {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) throw new Error('Cannot open URL');
    await Linking.openURL(url);
  } catch {
    Alert.alert('Action not available', 'Please try again later.');
  }
};

const openMaps = () => {
  const q = encodeURIComponent(MAP_QUERY);
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${q}`,
    android: `geo:0,0?q=${q}`,
  });
  openURL(url);
};

const callUs = () => openURL(`tel:${PHONE_RAW}`);
const emailUs = () => openURL(`mailto:${EMAIL}`);

const Tile = ({
  icon,
  title,
  children,
  onPress,
}) => {
  const Body = (
    <>
      <View style={styles.tileIconWrap}>
        <Icon name={icon} size={18} color="#F97316" />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <View>{typeof children === 'string' ? <Text style={styles.tileText}>{children}</Text> : children}</View>
      {!!onPress && <Text style={styles.tileHint}>Tap to open</Text>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.tile}>
        {Body}
      </TouchableOpacity>
    );
  }
  return <View style={styles.tile}>{Body}</View>;
};

const Index = () => {
  
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
        <View style={styles.heroContent}>
          <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
            <Text style={styles.heroTitle}>Get in Touch with Us</Text>
          </TouchableOpacity>
          <Text style={styles.heroSubtitle}>
            We’re here to help with orders, subscriptions and puja services.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 2-column grid: ONLY Customer Care + Email Us */}
        <View style={styles.grid}>
          <Tile icon="phone-alt" title="Customer Care" onPress={callUs}>
            <Text style={[styles.tileText, { fontWeight: '900', letterSpacing: 0.3 }]}>{PHONE_DISPLAY}</Text>
            <Text style={styles.tileHint}>Tap to call</Text>
          </Tile>

          <Tile icon="envelope" title="Email Us" onPress={emailUs}>
            <Text style={[styles.tileText, { fontWeight: '900' }]}>{EMAIL}</Text>
            <Text style={styles.tileHint}>Tap to compose</Text>
          </Tile>
        </View>

        {/* Address — full-width horizontal card (like Follow Us) */}
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={openMaps}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadge}>
              <Icon name="map-marker-alt" size={16} color="#F97316" />
            </View>
            <Text style={styles.cardTitle}>Address</Text>
          </View>

          <View style={styles.addressRow}>
            <View style={{ flex: 1, gap: 4 }}>
              {ADDRESS_LINES.map((l) => (
                <Text key={l} style={styles.tileText}>
                  {l}
                </Text>
              ))}
            </View>

            <TouchableOpacity style={styles.pillBtn} activeOpacity={0.9} onPress={openMaps}>
              <Icon name="directions" size={12} color="#0f172a" />
              <Text style={styles.pillText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Follow Us — full width */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadge}>
              <Icon name="share-alt" size={16} color="#F97316" />
            </View>
            <Text style={styles.cardTitle}>Follow Us</Text>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.9} onPress={() => openURL(LINKS.facebook)}>
              <Icon name="facebook-f" size={14} color="#0f172a" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.9} onPress={() => openURL(LINKS.instagram)}>
              <Icon name="instagram" size={14} color="#0f172a" />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.9} onPress={() => openURL(LINKS.linkedin)}>
              <Icon name="linkedin-in" size={14} color="#0f172a" />
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerNote}>Business hours: Mon–Sat, 10:00 AM – 6:00 PM IST</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

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
  backIcon: { position: 'absolute', left: 0 },
  heroContent: {},
  heroTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: { fontSize: 16, color: '#FFFFFF', textAlign: 'center', opacity: 0.9 },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },

  // Grid (2 tiles only)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  tile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: { color: '#0f172a', fontWeight: '900', fontSize: 15, marginBottom: 6 },
  tileText: { color: '#334155', fontWeight: '700', lineHeight: 20 },
  tileHint: { color: '#64748B', fontWeight: '600', marginTop: 4 },

  // Full-width cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#0f172a', fontWeight: '900', fontSize: 16 },

  // Address full-width layout
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  pillBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: { color: '#0f172a', fontWeight: '800' },

  // Social
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  socialBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: { color: '#0f172a', fontWeight: '800' },

  footerNote: { textAlign: 'center', color: '#64748B', fontWeight: '600', marginTop: 8 },
});