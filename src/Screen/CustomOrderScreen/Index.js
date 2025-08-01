import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { base_url } from '../../../App';

const Index = () => {

  const navigation = useNavigation();

  const [flowerDetails, setFlowerDetails] = useState([
    {
      flowerName: null,
      flowerQuantity: '',
      flowerUnit: null,
      flowerNameOpen: false,
      flowerUnitOpen: false,
    },
  ]);

  const handleAddMore = () => {
    setFlowerDetails([...flowerDetails, {
      flowerName: null,
      flowerQuantity: '',
      flowerUnit: null,
      flowerNameOpen: false,
      flowerUnitOpen: false,
    }]);
  };

  const handleRemove = (index) => {
    if (index > 0) {
      const newFlowerDetails = [...flowerDetails];
      newFlowerDetails.splice(index, 1);
      setFlowerDetails(newFlowerDetails);
    }
  };

  const [flowerNames, setFlowerNames] = useState([]);
  const [flowerUnits, setFlowerUnits] = useState([]);

  const getUnitList = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/manageunit', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });
      const responseData = await response.json();
      if (response.ok) {
        // console.log("Units fetched successfully", responseData);
        const units = responseData.data.map(unit => ({
          label: unit.unit_name,
          value: unit.unit_name
        }));
        setFlowerUnits(units);
      } else {
        console.error('Failed to fetch units:', responseData.message);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const getFlowerList = async () => {
    await fetch(base_url + 'api/products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(response => {
      if (response.status === 200) {
        // console.log("Flower List", response.data);
        const flowers = response.data.filter(product => product.category === "Flower");
        const flowerNames = flowers.map(flower => ({
          label: flower.name,
          value: flower.name
        }));
        setFlowerNames(flowerNames);
      } else {
        console.error('Failed to fetch packages:', response.message);
      }
    }).catch((error) => {
      console.error('Error:', error);
    });
  };

  useEffect(() => {
    getUnitList();
    getFlowerList();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Header with Gradient */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Custom Order</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              Create your own custom flower arrangements for any occasion
            </Text>
          </View>
        </LinearGradient>
        {/* Product Details */}
        <View style={styles.productDetails}>
          <View style={{ width: '35%', paddingVertical: 10 }}>
            <View style={styles.flowerImage}>
              <Image style={{ flex: 1, borderRadius: 8, resizeMode: 'cover' }} source={{ uri: 'https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg' }} />
            </View>
          </View>
          <View style={{ width: '60%', alignItems: 'flex-start', justifyContent: 'center' }}>
            <Text style={{ color: '#000', fontSize: 18, fontWeight: '500', textTransform: 'capitalize' }}>{'Customized Flower'}</Text>
            <Text style={{ color: '#000', fontSize: 14, fontWeight: '400', textTransform: 'capitalize', marginTop: 5 }}>Price :  {'120'}</Text>
          </View>
        </View>
        {/* Flower Details */}
        <View style={{ marginTop: 15, backgroundColor: '#fff', width: '100%', paddingHorizontal: 15, zIndex: 2000 }}>
          {flowerDetails.map((flowerDetail, index) => (
            <View key={index} style={{ width: '100%', padding: 10, marginVertical: 10, borderColor: '#7e7f80', borderWidth: 0.7, borderRadius: 7 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ width: '30%', marginBottom: 15, zIndex: 2000, elevation: 2000 }}>
                  <Text style={styles.label}>Flower</Text>
                  <View style={{ zIndex: 2000, elevation: 2000 }}>
                    <DropDownPicker
                      open={flowerDetail.flowerNameOpen}
                      value={flowerDetail.flowerName}
                      items={flowerNames}
                      setOpen={(open) => {
                        setFlowerDetails(prevDetails => {
                          const newDetails = [...prevDetails];
                          newDetails[index].flowerNameOpen = open;
                          return newDetails;
                        });
                      }}
                      setValue={(callback) => {
                        setFlowerDetails(prevDetails => {
                          const newDetails = [...prevDetails];
                          newDetails[index].flowerName = callback(newDetails[index].flowerName);
                          return newDetails;
                        });
                      }}
                      placeholder="Flower"
                      listMode="MODAL"
                      style={{ borderColor: '#edeff1', borderRadius: 5, marginTop: 5 }}
                      dropDownContainerStyle={{ borderColor: '#edeff1' }}
                      zIndex={2000}
                      zIndexInverse={1000}
                    />
                  </View>
                </View>
                <View style={{ width: '25%', marginBottom: 15, zIndex: 1500, elevation: 1500 }}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={{ borderColor: '#edeff1', borderRadius: 5, borderWidth: 1, padding: 10, fontSize: 15, color: '#000', marginTop: 3 }}
                    onChangeText={(text) => {
                      setFlowerDetails(prevDetails => {
                        const newDetails = [...prevDetails];
                        newDetails[index].flowerQuantity = text;
                        return newDetails;
                      });
                    }}
                    value={flowerDetail.flowerQuantity}
                    keyboardType="numeric"
                    placeholder="Quantity"
                    placeholderTextColor="#888888"
                    underlineColorAndroid='transparent'
                  />
                </View>
                <View style={{ width: '40%', zIndex: 1000, elevation: 1000 }}>
                  <Text style={styles.label}>Select Unit</Text>
                  <View style={{ zIndex: 1000, elevation: 1000 }}>
                    <DropDownPicker
                      open={flowerDetail.flowerUnitOpen}
                      value={flowerDetail.flowerUnit}
                      items={flowerUnits}
                      setOpen={(open) => {
                        setFlowerDetails(prevDetails => {
                          const newDetails = [...prevDetails];
                          newDetails[index].flowerUnitOpen = open;
                          return newDetails;
                        });
                      }}
                      setValue={(callback) => {
                        setFlowerDetails(prevDetails => {
                          const newDetails = [...prevDetails];
                          newDetails[index].flowerUnit = callback(newDetails[index].flowerUnit);
                          return newDetails;
                        });
                      }}
                      placeholder="Unit"
                      listMode="MODAL"
                      style={{ borderColor: '#edeff1', borderRadius: 5, marginTop: 5 }}
                      dropDownContainerStyle={{ borderColor: '#edeff1' }}
                      zIndex={1000}
                      zIndexInverse={2000}
                    />
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                {index === flowerDetails.length - 1 && (
                  <TouchableOpacity onPress={handleAddMore} style={{ backgroundColor: '#28a745', borderRadius: 5, alignItems: 'center', width: 100, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>Add More</Text>
                  </TouchableOpacity>
                )}
                {index > 0 && (
                  <TouchableOpacity onPress={() => handleRemove(index)} style={{ backgroundColor: '#dc3545', borderRadius: 5, alignItems: 'center', width: 100, height: 46, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    flex: 1
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
  productDetails: {
    width: '95%',
    alignSelf: 'center',
    marginTop: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  flowerImage: {
    height: 120,
    width: 120,
    borderRadius: 8,
    backgroundColor: '#6c757d'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
})