// Icon component - Unified icon system using Ionicons
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

// Map friendly names to Ionicons
const iconMap = {
  // Navigation
  home: 'home',
  'home-outline': 'home-outline',
  tasks: 'checkbox',
  'tasks-outline': 'checkbox-outline',
  habits: 'refresh',
  'habits-outline': 'refresh-outline',
  settings: 'settings',
  'settings-outline': 'settings-outline',
  more: 'ellipsis-horizontal',

  // Actions
  add: 'add',
  'add-circle': 'add-circle',
  close: 'close',
  check: 'checkmark',
  'check-circle': 'checkmark-circle',
  edit: 'pencil',
  delete: 'trash',
  search: 'search',
  filter: 'filter',
  sort: 'swap-vertical',
  share: 'share',
  copy: 'copy',

  // Navigation arrows
  back: 'chevron-back',
  forward: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
  'arrow-right': 'arrow-forward',
  'arrow-left': 'arrow-back',

  // Status
  info: 'information-circle',
  warning: 'warning',
  error: 'alert-circle',
  success: 'checkmark-circle',

  // Focus/Timer
  play: 'play',
  pause: 'pause',
  stop: 'stop',
  timer: 'timer',
  'timer-outline': 'timer-outline',

  // User
  person: 'person',
  'person-outline': 'person-outline',
  'log-out': 'log-out',
  'log-in': 'log-in',

  // Features
  brain: 'bulb',
  calendar: 'calendar',
  'calendar-outline': 'calendar-outline',
  chart: 'bar-chart',
  'chart-outline': 'bar-chart-outline',
  trophy: 'trophy',
  'trophy-outline': 'trophy-outline',
  star: 'star',
  'star-outline': 'star-outline',
  heart: 'heart',
  'heart-outline': 'heart-outline',
  flame: 'flame',
  flash: 'flash',
  sparkles: 'sparkles',

  // Wellness
  happy: 'happy',
  sad: 'sad',
  'leaf-outline': 'leaf-outline',

  // Communication
  mail: 'mail',
  'mail-outline': 'mail-outline',
  notifications: 'notifications',
  'notifications-outline': 'notifications-outline',

  // Media
  image: 'image',
  camera: 'camera',
  mic: 'mic',
  'mic-outline': 'mic-outline',

  // Misc
  moon: 'moon',
  'moon-outline': 'moon-outline',
  sunny: 'sunny',
  'sunny-outline': 'sunny-outline',
  eye: 'eye',
  'eye-off': 'eye-off',
  lock: 'lock-closed',
  'lock-outline': 'lock-closed-outline',
  help: 'help-circle',
  'help-outline': 'help-circle-outline',
  refresh: 'refresh',
  sync: 'sync',
  cloud: 'cloud',
  'cloud-outline': 'cloud-outline',
  document: 'document',
  'document-outline': 'document-text-outline',
  folder: 'folder',
  'folder-outline': 'folder-outline',
  bookmark: 'bookmark',
  'bookmark-outline': 'bookmark-outline',
  tag: 'pricetag',
  'tag-outline': 'pricetag-outline',
  link: 'link',
  location: 'location',
  'location-outline': 'location-outline',

  // Study
  book: 'book',
  'book-outline': 'book-outline',
  school: 'school',
  'school-outline': 'school-outline',
  library: 'library',
  'library-outline': 'library-outline',

  // AI
  robot: 'hardware-chip',
  wand: 'color-wand',
  sparkle: 'sparkles',
} as const;

type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.gray[600],
  style,
}) => {
  const ionIconName = iconMap[name] as keyof typeof Ionicons.glyphMap;

  return (
    <Ionicons
      name={ionIconName}
      size={size}
      color={color}
      style={style}
    />
  );
};

// Preset icon sizes
export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
};

export default Icon;
