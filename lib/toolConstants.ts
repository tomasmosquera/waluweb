export type ToolType =
  | 'Banks'
  | 'Cash'
  | 'Credit Cards'
  | 'Tabs'
  | 'Investments'
  | 'Savings'
  | 'Assets'
  | 'Liabilities'
  | 'Others';

export const ALL_TOOL_TYPES: ToolType[] = [
  'Banks', 'Cash', 'Credit Cards', 'Tabs', 'Investments', 'Savings', 'Assets', 'Liabilities', 'Others',
];

export const TOOL_TYPE_META: Record<ToolType, { defaultColor: string; defaultIcon: string; isLiability: boolean }> = {
  Banks:          { defaultColor: '#4CAF50', defaultIcon: 'wallet',                    isLiability: false },
  Cash:           { defaultColor: '#2E7D32', defaultIcon: 'cash',                      isLiability: false },
  'Credit Cards': { defaultColor: '#9C27B0', defaultIcon: 'card',                      isLiability: true  },
  Tabs:           { defaultColor: '#607D8B', defaultIcon: 'people',                    isLiability: false },
  Investments:    { defaultColor: '#1976D2', defaultIcon: 'trending-up',               isLiability: false },
  Savings:        { defaultColor: '#1976D2', defaultIcon: 'wallet',                    isLiability: false },
  Assets:         { defaultColor: '#FF9800', defaultIcon: 'home',                      isLiability: false },
  Liabilities:    { defaultColor: '#F44336', defaultIcon: 'trending-down',             isLiability: true  },
  Others:         { defaultColor: '#607D8B', defaultIcon: 'ellipsis-horizontal-circle', isLiability: false },
};

// 64 Material Design colors (same palette as mobile app)
export const TOOL_COLORS: string[] = [
  '#B71C1C', '#C62828', '#E53935', '#EF5350', '#E57373', '#EF9A9A', '#FFCDD2', '#FFEBEE',
  '#880E4F', '#AD1457', '#E91E63', '#EC407A', '#F06292', '#F48FB1', '#F8BBD0', '#FCE4EC',
  '#4A148C', '#6A1B9A', '#7B1FA2', '#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
  '#311B92', '#1A237E', '#283593', '#3F51B5', '#5C6BC0', '#9FA8DA', '#C5CAE9', '#E8EAF6',
  '#0D47A1', '#1565C0', '#2196F3', '#42A5F5', '#90CAF9', '#E3F2FD', '#00838F', '#00BCD4',
  '#00695C', '#009688', '#80CBC4', '#E0F2F1', '#1B5E20', '#4CAF50', '#A5D6A7', '#E8F5E9',
  '#FFEB3B', '#FFFDE7', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#212121',
  '#37474F', '#546E7A', '#607D8B', '#90A4AE', '#B0BEC5', '#CFD8DC', '#ECEFF1', '#FFFFFF',
];

// Icon names matching Ionicons (for mobile compatibility)
export const TOOL_ICONS: string[] = [
  // Finance
  'wallet', 'card', 'cash', 'trending-up', 'trending-down', 'swap-horizontal',
  'calculator', 'receipt', 'pricetag', 'stats-chart',
  // Business
  'business', 'briefcase', 'bar-chart', 'lock-closed', 'document-text',
  'clipboard', 'key', 'people',
  // Food & Drinks
  'cafe', 'fast-food', 'restaurant', 'pizza', 'beer', 'wine', 'ice-cream',
  'nutrition', 'egg', 'fish', 'basket', 'storefront',
  // Transport
  'car', 'car-sport', 'bicycle', 'compass', 'bus', 'airplane', 'boat',
  'train', 'walk', 'navigate',
  // Health & Fitness
  'fitness', 'medical', 'heart', 'bandage', 'medkit', 'thermometer', 'pulse', 'body',
  // Home & Living
  'home', 'hammer', 'flash', 'water', 'construct', 'bed', 'bulb', 'cut',
  // Shopping & Lifestyle
  'cart', 'bag-handle', 'shirt', 'gift', 'diamond', 'glasses', 'watch', 'bookmark',
  // Entertainment
  'game-controller', 'camera', 'musical-notes', 'headset', 'film', 'tv', 'mic', 'book',
  // Technology
  'phone-portrait', 'laptop', 'wifi', 'bluetooth', 'desktop', 'code-slash',
  // Nature
  'paw', 'leaf', 'sunny', 'flower', 'planet', 'snow',
];

export const DEFAULT_TOOL_COLOR = '#2196F3';
export const DEFAULT_TOOL_ICON  = 'wallet';
export const DEFAULT_CURRENCY   = 'COP';
export const OUT_OF_MONTRACKER  = 'out-of-montracker';
