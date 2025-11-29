import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, MapPin, Upload, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAppStore } from '@/store/appStore';
import { Incident } from '@/types';

const INCIDENT_TYPES = [
  { value: 'flood', label: 'Flood', color: '#3B82F6' },
  { value: 'landslide', label: 'Landslide', color: '#8B4513' },
  { value: 'pollution', label: 'Pollution', color: '#EF4444' },
  { value: 'accident', label: 'Accident', color: '#F59E0B' },
] as const;

export default function ReportScreen() {
  const { addIncident, location } = useAppStore();
  const [selectedType, setSelectedType] = useState<(typeof INCIDENT_TYPES)[number]['value'] | null>(
    null,
  );
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an incident type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setIsSubmitting(true);

    try {
      let currentLocation = location;

      if (!currentLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          currentLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        } else {
          currentLocation = { latitude: 10.8231, longitude: 106.6297 };
        }
      }

      const incident: Incident = {
        id: Date.now().toString(),
        type: selectedType,
        description: description.trim(),
        imageUri: imageUri || undefined,
        location: currentLocation,
        timestamp: Date.now(),
        status: 'pending',
      };

      addIncident(incident);

      Alert.alert('Success', 'Your incident report has been submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedType(null);
            setDescription('');
            setImageUri(null);
          },
        },
      ]);
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Report Incident',
          headerStyle: {
            backgroundColor: Colors.primary.blue,
          },
          headerTintColor: Colors.text.white,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Incident Type</Text>
        <View style={styles.typeGrid}>
          {INCIDENT_TYPES.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.typeCard,
                selectedType === type.value && styles.typeCardSelected,
                { borderColor: type.color },
              ]}
              onPress={() => setSelectedType(type.value)}
            >
              <View
                style={[
                  styles.typeIndicator,
                  { backgroundColor: type.color },
                  selectedType === type.value && styles.typeIndicatorSelected,
                ]}
              />
              <Text
                style={[styles.typeLabel, selectedType === type.value && styles.typeLabelSelected]}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the incident in detail..."
          placeholderTextColor={Colors.text.light}
          multiline
          numberOfLines={5}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Photo Evidence (Optional)</Text>

        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <Pressable style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <X size={20} color={Colors.text.white} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            {Platform.OS !== 'web' && (
              <Pressable style={styles.imageButton} onPress={takePhoto}>
                <Camera size={24} color={Colors.primary.blue} />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </Pressable>
            )}
            <Pressable style={styles.imageButton} onPress={pickImage}>
              <Upload size={24} color={Colors.primary.blue} />
              <Text style={styles.imageButtonText}>Choose from Gallery</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.locationInfo}>
          <MapPin size={16} color={Colors.text.secondary} />
          <Text style={styles.locationText}>Location will be automatically attached</Text>
        </View>

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  typeCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  typeCardInner: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeCardSelected: {
    borderWidth: 2,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  typeIndicatorSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500' as const,
  },
  typeLabelSelected: {
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  textArea: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageButtonText: {
    fontSize: 14,
    color: Colors.primary.blue,
    marginTop: 8,
    fontWeight: '500' as const,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.white,
  },
});
