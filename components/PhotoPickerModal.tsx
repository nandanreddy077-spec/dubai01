import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPicked?: (uri: string) => void;
  isRequired?: boolean;
}

export default function PhotoPickerModal({ visible, onClose, onPicked, isRequired = false }: PhotoPickerModalProps) {
  const { updateAvatar } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  console.log('PhotoPickerModal rendered with visible:', visible);

  const requestPermissions = async () => {
    console.log('Requesting permissions...');
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library permission status:', status);
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant camera roll permissions to select a photo.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
            ]
          );
          return false;
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
        Alert.alert('Error', 'Failed to request permissions. Please try again.');
        return false;
      }
    }
    return true;
  };

  const pickImageFromLibrary = async () => {
    console.log('Starting image picker from library...');
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('Permission denied, aborting image picker');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        
        try {
          await updateAvatar(imageUri);
          console.log('Avatar updated successfully');
          
          if (onPicked) {
            onPicked(imageUri);
          }
          onClose();
        } catch (updateError) {
          console.error('Error updating avatar:', updateError);
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        }
      } else {
        console.log('Image selection was canceled or no image selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    console.log('Starting camera...');
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web. Please select from library.');
      return;
    }

    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take a photo.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        setIsLoading(false);
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Captured image URI:', imageUri);
        
        try {
          await updateAvatar(imageUri);
          console.log('Avatar updated successfully from camera');
          
          if (onPicked) {
            onPicked(imageUri);
          }
          onClose();
        } catch (updateError) {
          console.error('Error updating avatar from camera:', updateError);
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        }
      } else {
        console.log('Camera was canceled or no photo taken');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    console.log('Modal close requested');
    if (!isRequired) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Profile Photo</Text>
            {!isRequired && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            )}
          </View>
          
          {isRequired && (
            <View style={styles.requiredNotice}>
              <Text style={styles.requiredText}>Profile photo is required to continue</Text>
            </View>
          )}

          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.option, isLoading && styles.optionDisabled]}
              onPress={pickImageFromLibrary}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <ImageIcon color="#D4A574" size={24} />
              </View>
              <Text style={styles.optionText}>
                {isLoading ? 'Selecting...' : 'Choose from Library'}
              </Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.option, isLoading && styles.optionDisabled]}
                onPress={takePhoto}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Camera color="#D4A574" size={24} />
                </View>
                <Text style={styles.optionText}>
                  {isLoading ? 'Opening Camera...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  requiredNotice: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  requiredText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
});