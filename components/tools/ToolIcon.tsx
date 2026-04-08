import React from 'react';
import {
  Wallet, CreditCard, Banknote, TrendingUp, TrendingDown, ArrowLeftRight,
  Calculator, Receipt, Tag, BarChart2, Building2, Briefcase, BarChart,
  Lock, FileText, Clipboard, Key, Users, Coffee, Utensils, UtensilsCrossed,
  Pizza, Beer, Wine, IceCreamCone, Salad, Egg, Fish, ShoppingBasket, Store,
  Car, Bike, Compass, Bus, Plane, Anchor, Train, Footprints, Navigation,
  Dumbbell, Stethoscope, Heart, Shield, Cross, Thermometer, Activity,
  PersonStanding, Home, Hammer, Zap, Droplets, Wrench, BedDouble, Lightbulb,
  Scissors, ShoppingCart, ShoppingBag, Shirt, Gift, Gem, Glasses, Watch,
  Bookmark, Gamepad2, Camera, Music, Headphones, Film, Tv, Mic, Book,
  Smartphone, Laptop, Wifi, Bluetooth, Monitor, Code, PawPrint, Leaf, Sun,
  Flower, Globe, Snowflake, MoreHorizontal, type LucideIcon,
} from 'lucide-react';

/* ── Ionicons name → Lucide component ───────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  // Finance
  'wallet':                Wallet,
  'card':                  CreditCard,
  'cash':                  Banknote,
  'trending-up':           TrendingUp,
  'trending-down':         TrendingDown,
  'swap-horizontal':       ArrowLeftRight,
  'calculator':            Calculator,
  'receipt':               Receipt,
  'pricetag':              Tag,
  'stats-chart':           BarChart2,
  // Business
  'business':              Building2,
  'briefcase':             Briefcase,
  'bar-chart':             BarChart,
  'lock-closed':           Lock,
  'document-text':         FileText,
  'clipboard':             Clipboard,
  'key':                   Key,
  'people':                Users,
  // Food & Drinks
  'cafe':                  Coffee,
  'fast-food':             Utensils,
  'restaurant':            UtensilsCrossed,
  'pizza':                 Pizza,
  'beer':                  Beer,
  'wine':                  Wine,
  'ice-cream':             IceCreamCone,
  'nutrition':             Salad,
  'egg':                   Egg,
  'fish':                  Fish,
  'basket':                ShoppingBasket,
  'storefront':            Store,
  // Transport
  'car':                   Car,
  'car-sport':             Car,
  'bicycle':               Bike,
  'compass':               Compass,
  'bus':                   Bus,
  'airplane':              Plane,
  'boat':                  Anchor,
  'train':                 Train,
  'walk':                  Footprints,
  'navigate':              Navigation,
  // Health & Fitness
  'fitness':               Dumbbell,
  'medical':               Stethoscope,
  'heart':                 Heart,
  'bandage':               Shield,
  'medkit':                Cross,
  'thermometer':           Thermometer,
  'pulse':                 Activity,
  'body':                  PersonStanding,
  // Home & Living
  'home':                  Home,
  'hammer':                Hammer,
  'flash':                 Zap,
  'water':                 Droplets,
  'construct':             Wrench,
  'bed':                   BedDouble,
  'bulb':                  Lightbulb,
  'cut':                   Scissors,
  // Shopping & Lifestyle
  'cart':                  ShoppingCart,
  'bag-handle':            ShoppingBag,
  'shirt':                 Shirt,
  'gift':                  Gift,
  'diamond':               Gem,
  'glasses':               Glasses,
  'watch':                 Watch,
  'bookmark':              Bookmark,
  // Entertainment
  'game-controller':       Gamepad2,
  'camera':                Camera,
  'musical-notes':         Music,
  'headset':               Headphones,
  'film':                  Film,
  'tv':                    Tv,
  'mic':                   Mic,
  'book':                  Book,
  // Technology
  'phone-portrait':        Smartphone,
  'laptop':                Laptop,
  'wifi':                  Wifi,
  'bluetooth':             Bluetooth,
  'desktop':               Monitor,
  'code-slash':            Code,
  // Nature
  'paw':                   PawPrint,
  'leaf':                  Leaf,
  'sunny':                 Sun,
  'flower':                Flower,
  'planet':                Globe,
  'snow':                  Snowflake,
  // Fallback
  'ellipsis-horizontal-circle': MoreHorizontal,
};

interface ToolIconProps {
  icon: string;
  color: string;
  size?: number;
  /** If true, renders a colored square container like the mobile app */
  withContainer?: boolean;
  containerSize?: number;
}

export default function ToolIcon({
  icon,
  color,
  size = 18,
  withContainer = true,
  containerSize,
}: ToolIconProps) {
  const cSize = containerSize ?? size + 16;
  const IconComponent = ICON_MAP[icon];

  const iconNode = IconComponent ? (
    <IconComponent size={size} color={withContainer ? '#fff' : color} strokeWidth={2} />
  ) : (
    // Custom text icon (max 3 chars) or unknown icon name
    <span
      style={{
        fontSize: Math.max(size * 0.55, 9),
        fontWeight: 700,
        color: withContainer ? '#fff' : color,
        lineHeight: 1,
        letterSpacing: -0.5,
      }}
    >
      {icon.length <= 3 ? icon.toUpperCase() : icon.slice(0, 1).toUpperCase()}
    </span>
  );

  if (!withContainer) return <>{iconNode}</>;

  return (
    <div
      style={{
        width: cSize,
        height: cSize,
        borderRadius: cSize * 0.28,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {iconNode}
    </div>
  );
}
