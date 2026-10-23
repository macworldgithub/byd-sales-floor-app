import React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../lib/theme';

export type IconFamily = 'ionicons' | 'feather' | 'material';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  family?: IconFamily;
  style?: StyleProp<TextStyle>;
}

export default function Icon({
  name,
  size = 20,
  color = Colors.textPrimary,
  family = 'ionicons',
  style,
}: IconProps) {
  if (family === 'feather') {
    return <Feather name={name as any} size={size} color={color} style={style} />;
  }
  if (family === 'material') {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} style={style} />;
  }
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}
