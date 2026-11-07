import React from 'react';
import { Text, View } from 'react-native';
import { useResource } from '../../lib/floorContext';
import { mobileApi, Row } from '../../lib/mobileApi';
import { ErrorBox, styles } from './Controls';

export function VehicleCheckStatus() {
  const resource = useResource(() => mobileApi.vehicleStatus(), 'vehicle-provider-status', {} as Row);
  return <View><ErrorBox message={resource.error} />{['rego', 'ppsr'].map(key => resource.data[key] && <Text key={key} style={styles.muted}>{key === 'rego' ? 'Rego / VIN' : 'PPSR'}: {resource.data[key].configured ? 'Provider configured; each result requires live verification.' : `Unavailable. ${resource.data[key].reason}`}</Text>)}</View>;
}
