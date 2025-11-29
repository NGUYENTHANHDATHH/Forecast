import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAppStore } from '@/store/appStore';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

export default function MapScreen() {
  const { location, sensors } = useAppStore();
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  const initialRegion = {
    latitude: location?.latitude || 10.8231,
    longitude: location?.longitude || 106.6297,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Environmental Map',
          headerStyle: {
            backgroundColor: Colors.primary.blue,
          },
          headerTintColor: Colors.text.white,
        }}
      />

      {Platform.OS === 'web' ? (
        <View style={styles.webPlaceholder}>
          <MapPin size={64} color={Colors.text.light} />
          <Text style={styles.placeholderText}>Map view is available on mobile devices</Text>
          <Text style={styles.placeholderSubtext}>
            Scan the QR code to view the map on your phone
          </Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {sensors.map((sensor) => (
              <Marker
                key={sensor.id}
                coordinate={{
                  latitude: sensor.latitude,
                  longitude: sensor.longitude,
                }}
                title={sensor.name}
                description={`AQI: ${sensor.lastReading.aqi || 'N/A'}`}
                onPress={() => setSelectedSensor(sensor.id)}
              />
            ))}
          </MapView>

          {selectedSensor && (
            <View style={styles.infoPanel}>
              {(() => {
                const sensor = sensors.find((s) => s.id === selectedSensor);
                if (!sensor) return null;
                return (
                  <ScrollView>
                    <Text style={styles.infoTitle}>{sensor.name}</Text>
                    <Text style={styles.infoSubtitle}>
                      {sensor.type.replace('_', ' ').toUpperCase()}
                    </Text>

                    <View style={styles.infoGrid}>
                      {sensor.lastReading.aqi && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>AQI</Text>
                          <Text style={styles.infoValue}>{sensor.lastReading.aqi}</Text>
                        </View>
                      )}
                      {sensor.lastReading.temperature && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Temperature</Text>
                          <Text style={styles.infoValue}>{sensor.lastReading.temperature}°C</Text>
                        </View>
                      )}
                      {sensor.lastReading.humidity && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Humidity</Text>
                          <Text style={styles.infoValue}>{sensor.lastReading.humidity}%</Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            sensor.status === 'active'
                              ? Colors.status.good
                              : Colors.status.unhealthy,
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>{sensor.status.toUpperCase()}</Text>
                    </View>
                  </ScrollView>
                );
              })()}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: 300,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    width: '33.33%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text.white,
  },
});
