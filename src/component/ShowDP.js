import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native'
import React, { useState } from 'react'
import Modal from 'react-native-modal';
import ImageZoom from 'react-native-image-pan-zoom';
import Entypo from 'react-native-vector-icons/Entypo';

const ShowDP = ({ showProfileImage, onClose, imageSource }) => {
    return (
        <Modal isVisible={showProfileImage} style={{ margin: 0 }} backdropOpacity={0.9}>
            <View style={styles.modalContainer}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    {/* <Text style={styles.closeButtonText}>Close</Text> */}
                    <Entypo name="cross" color={'#fff'} size={32} />
                </TouchableOpacity>
                <ImageZoom
                    cropWidth={Dimensions.get('window').width}
                    cropHeight={Dimensions.get('window').height}
                    imageWidth={Dimensions.get('window').width}
                    imageHeight={Dimensions.get('window').height}
                    enableDoubleClickZoom={true}
                    doubleClickInterval={275}
                >
                    <Image
                        source={{ uri: imageSource }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                </ImageZoom>
            </View>
        </Modal>
    )
}

export default ShowDP

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 15,
        zIndex: 999,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 18,
    },
})