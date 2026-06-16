import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackgroundProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRouter } from "expo-router";
import { colors, fonts } from "@/lib/tokens";

type ExploreState = "home" | "pre-departure" | "trip";
type TrustChip = "Verified" | "Untouched" | "Community-flagged" | null;

type CardItem = {
  id: string;
  name: string;
  image: string;
  distance: string;
  season: string;
  cue: string;
  trust: TrustChip;
  askPrompt: string;
  proof?: string;
  openStatus?: string;
  coords?: { latitude: number; longitude: number };
  description?: string;
  travelTime?: string;
  bestTime?: string;
  knownFor?: string;
  placeType?: string;
  idealTripLength?: string;
};

type HomeRow = {
  id: string;
  title: string;
  chevronLabel: string;
  ranked?: boolean;
  tiles: CardItem[];
};

type TripRecord = {
  id: string;
  destinationName: string;
  destinationCenter: { latitude: number; longitude: number };
  geofenceRadiusKm: number;
  departureAt: string;
  returnAt: string;
  summary: string;
};

type ExploreSignals = {
  gpsKnown: boolean;
  gpsConfidence: "high" | "weak";
  currentCoords?: { latitude: number; longitude: number };
  homeCoords: { latitude: number; longitude: number };
  homeRadiusKm: number;
  tripRecords: TripRecord[];
};

const SAVE_KEY = "hita.explore.saved.v1";
const PLAN_KEY = "hita.explore.seeded.v1";
const HOME_COORDS = { latitude: 17.385, longitude: 78.4867 };

const MOCK_TRIPS: TripRecord[] = [
  {
    id: "trip_hyd_01",
    destinationName: "Hyderabad",
    destinationCenter: { latitude: 17.385, longitude: 78.4867 },
    geofenceRadiusKm: 10,
    departureAt: "2026-06-15T06:00:00.000Z",
    returnAt: "2026-06-19T18:00:00.000Z",
    summary: "Old city stay · Metro pass · Chowmahalla ticket",
  },
];

const HERO: CardItem = {
  id: "hero_hampi",
  name: "Hampi",
  image:
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1600&auto=format&fit=crop",
  distance: "5 hrs from Hyderabad",
  travelTime: "Road/train",
  season: "Best time now",
  bestTime: "Oct-Feb",
  cue: "Ancient boulder valleys, sunrise viewpoints, and slow riverside evenings.",
  description:
    "Hampi blends dramatic boulder landscapes, temple architecture, and slow riverside neighborhoods. It works best as a relaxed two-night loop with sunrise viewpoints and local food stops.",
  trust: "Verified",
  askPrompt: "Plan a calm weekend in Hampi with quiet stays and sunrise spots",
  proof: "Why this surfaced: aligns with your saved slow-travel style.",
  knownFor: "Boulder landscapes, UNESCO ruins, sunrise points",
  placeType: "Heritage",
  idealTripLength: "2-3 days",
  coords: { latitude: 15.335, longitude: 76.46 },
};

const WEEKEND_TILES: CardItem[] = [
  {
    id: "weekend_1",
    name: "Pondicherry",
    image:
      "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=1400&auto=format&fit=crop",
    distance: "4 hrs",
    travelTime: "Road",
    season: "Best now",
    bestTime: "Oct-Mar",
    cue: "French quarter walks and beachside cafes.",
    trust: "Verified",
    askPrompt: "Build a Pondicherry weekend with ocean walks and cozy cafes",
    proof: "Why this surfaced: matches your calm city-break preference.",
    description: "Compact coastal city for architecture walks and sea breeze evenings.",
    knownFor: "Promenade, French quarter, cafes",
    placeType: "Coastal city",
    idealTripLength: "2 days",
    coords: { latitude: 11.9416, longitude: 79.8083 },
  },
  {
    id: "weekend_2",
    name: "Coorg",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1400&auto=format&fit=crop",
    distance: "6 hrs",
    travelTime: "Road",
    season: "Monsoon peak",
    bestTime: "Jul-Sep",
    cue: "Coffee estates and misty forest loops.",
    trust: "Untouched",
    askPrompt: "Give me a gentle Coorg itinerary for two days",
    proof: "Why this surfaced: weather and nature preference fit.",
    description: "Green highland escape with plantation stays and scenic drives.",
    knownFor: "Coffee estates, waterfalls",
    placeType: "Hills",
    idealTripLength: "2-3 days",
    coords: { latitude: 12.3375, longitude: 75.8069 },
  },
  {
    id: "weekend_3",
    name: "Gokarna",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
    distance: "7 hrs",
    travelTime: "Road",
    season: "Best now",
    bestTime: "Nov-Feb",
    cue: "Cliff beaches and sunset coves.",
    trust: "Verified",
    askPrompt: "Suggest a slow Gokarna beach weekend",
    proof: "Why this surfaced: beach and less-crowd preference.",
    description: "Slow beach circuit with short cliff walks and sunset coves.",
    knownFor: "Cliff beaches, sunset points",
    placeType: "Beach",
    idealTripLength: "2 days",
    coords: { latitude: 14.5479, longitude: 74.3188 },
  },
];

const TRENDING_TILES: CardItem[] = [
  {
    id: "trend_1",
    name: "Udaipur",
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1400&auto=format&fit=crop",
    distance: "2 hrs flight",
    travelTime: "Flight",
    season: "Best now",
    cue: "Lake palaces and old-city rooftops.",
    trust: "Verified",
    askPrompt: "Create an Udaipur inspiration plan for a long weekend",
    coords: { latitude: 24.5854, longitude: 73.7125 },
  },
  {
    id: "trend_2",
    name: "Shillong",
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1400&auto=format&fit=crop",
    distance: "3 hrs flight",
    travelTime: "Flight + road",
    season: "Rain season",
    cue: "Cloud forests and music streets.",
    trust: "Untouched",
    askPrompt: "What is a scenic Shillong plan with local music spots?",
    coords: { latitude: 25.5788, longitude: 91.8933 },
  },
  {
    id: "trend_3",
    name: "Leh",
    image:
      "https://images.unsplash.com/photo-1626621331169-5b0f5a9f89f0?q=80&w=1400&auto=format&fit=crop",
    distance: "2.5 hrs flight",
    travelTime: "Flight",
    season: "Peak season",
    cue: "High-altitude passes and monasteries.",
    trust: "Community-flagged",
    askPrompt: "Draft a Leh inspiration plan with acclimatization tips",
    coords: { latitude: 34.1526, longitude: 77.5771 },
  },
];

const WORLD_TILES: CardItem[] = [
  {
    id: "world_1",
    name: "Kyoto",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1400&auto=format&fit=crop",
    distance: "8 hrs flight",
    travelTime: "Flight",
    season: "Autumn best",
    cue: "Temple lanes and quiet tea houses.",
    trust: "Verified",
    askPrompt: "Inspire me with a calm Kyoto route for first-timers",
    coords: { latitude: 35.0116, longitude: 135.7681 },
  },
  {
    id: "world_2",
    name: "Lisbon",
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=1400&auto=format&fit=crop",
    distance: "11 hrs flight",
    travelTime: "Flight",
    season: "Best now",
    cue: "Tram hills and Atlantic light.",
    trust: "Untouched",
    askPrompt: "Build a Lisbon dream week with art and food neighborhoods",
    coords: { latitude: 38.7223, longitude: -9.1393 },
  },
  {
    id: "world_3",
    name: "Bali",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1400&auto=format&fit=crop",
    distance: "6.5 hrs flight",
    travelTime: "Flight",
    season: "Dry season",
    cue: "Rice terraces and ocean temples.",
    trust: "Verified",
    askPrompt: "Design a gentle Bali escape with fewer crowds",
    coords: { latitude: -8.3405, longitude: 115.092 },
  },
];

const SEASON_TILES: CardItem[] = [
  {
    id: "season_1",
    name: "Munnar",
    image:
      "https://images.unsplash.com/photo-1562599932-2836d0f7b6f5?q=80&w=1400&auto=format&fit=crop",
    distance: "1 hr flight + 4 hrs",
    travelTime: "Flight + road",
    season: "Monsoon best",
    cue: "Tea valleys and cloud trails.",
    trust: "Verified",
    askPrompt: "Plan a monsoon Munnar inspiration weekend",
    coords: { latitude: 10.0889, longitude: 77.0595 },
  },
  {
    id: "season_2",
    name: "Valley of Flowers",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1400&auto=format&fit=crop",
    distance: "Flight + road",
    travelTime: "Multi-leg",
    season: "Seasonal peak",
    cue: "Alpine bloom windows and hikes.",
    trust: "Untouched",
    askPrompt: "Show me a Valley of Flowers seasonal travel idea",
    coords: { latitude: 30.728, longitude: 79.605 },
  },
  {
    id: "season_3",
    name: "Sikkim",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1400&auto=format&fit=crop",
    distance: "2 hrs flight",
    travelTime: "Flight + road",
    season: "Clear skies",
    cue: "Mountain monasteries and ridge roads.",
    trust: "Verified",
    askPrompt: "Create a scenic Sikkim inspiration circuit",
    coords: { latitude: 27.533, longitude: 88.5122 },
  },
];

const PERSONALIZED_POOL: CardItem[] = [
  {
    id: "saved_match_1",
    name: "Alleppey",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=1400&auto=format&fit=crop",
    distance: "1.5 hrs flight",
    travelTime: "Flight + cab",
    season: "Best now",
    cue: "Backwater houseboats and village canals.",
    trust: "Verified",
    askPrompt: "What is a peaceful Alleppey weekend inspired by my saved places?",
    coords: { latitude: 9.4981, longitude: 76.3388 },
  },
  {
    id: "saved_match_2",
    name: "Kabini",
    image:
      "https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1400&auto=format&fit=crop",
    distance: "7 hrs",
    travelTime: "Road",
    season: "Best now",
    cue: "Lakeside lodges and safari dawns.",
    trust: "Untouched",
    askPrompt: "Suggest a Kabini nature retreat based on what I save",
    coords: { latitude: 11.9733, longitude: 76.2956 },
  },
  {
    id: "saved_match_3",
    name: "Spiti",
    image:
      "https://images.unsplash.com/photo-1631085274266-6b9c4f57fa1c?q=80&w=1400&auto=format&fit=crop",
    distance: "Flight + road",
    travelTime: "Multi-leg",
    season: "Summer peak",
    cue: "Stark valleys and high-altitude villages.",
    trust: "Community-flagged",
    askPrompt: "Map a Spiti dream route with risk notes",
    coords: { latitude: 32.2461, longitude: 78.0344 },
  },
];

const PRE_CARDS: CardItem[] = [
  {
    id: "pre_1",
    name: "Countdown + trip summary",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop",
    distance: "Departure in 22 hrs",
    season: "Near future",
    cue: "Dates, destination, and booked essentials at a glance.",
    trust: "Verified",
    askPrompt: "Show my departure countdown and trip summary",
  },
  {
    id: "pre_2",
    name: "Area safety brief",
    image:
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=80&w=1200&auto=format&fit=crop",
    distance: "Destination context",
    season: "Read before leaving",
    cue: "Time-of-day shifts, caution pockets, and confidence zones.",
    trust: "Verified",
    askPrompt: "Give me a complete destination safety brief",
  },
  {
    id: "pre_3",
    name: "Know before you go",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop",
    distance: "Local know-how",
    season: "Practical prep",
    cue: "Transport, tipping, phrases, currency, and data setup.",
    trust: "Untouched",
    askPrompt: "What should I know before arriving in Hyderabad?",
  },
  {
    id: "pre_4",
    name: "Conditions + packing",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
    distance: "Weather-informed",
    season: "Updated hourly",
    cue: "What to carry, what to skip, and comfort priorities.",
    trust: "Untouched",
    askPrompt: "Generate my weather-based packing checklist",
  },
];

const TRIP_CARDS: CardItem[] = [
  {
    id: "trip_1",
    name: "Charminar",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1200&auto=format&fit=crop",
    distance: "600m",
    season: "Best now",
    cue: "Light crowd now, lively by sunset.",
    trust: "Verified",
    openStatus: "Open till 9:00 pm",
    askPrompt: "Safest way to explore Charminar right now",
    proof: "Why this surfaced: walkable and aligns with your heritage preference.",
    coords: { latitude: 17.3616, longitude: 78.4747 },
  },
  {
    id: "trip_2",
    name: "Salar Jung Museum",
    image:
      "https://images.unsplash.com/photo-1545243424-0ce743321e11?q=80&w=1200&auto=format&fit=crop",
    distance: "1.8km",
    season: "Indoor pick",
    cue: "Better option if rain arrives this evening.",
    trust: "Untouched",
    openStatus: "Open till 5:00 pm",
    askPrompt: "Route me safely to Salar Jung and suggest nearby essentials",
    proof: "Why this surfaced: weather shift in 40 minutes.",
    coords: { latitude: 17.3713, longitude: 78.4804 },
  },
  {
    id: "trip_3",
    name: "Laad Bazaar",
    image:
      "https://images.unsplash.com/photo-1512418490979-92798cec1380?q=80&w=1200&auto=format&fit=crop",
    distance: "900m",
    season: "Best 4-7 pm",
    cue: "Great crafts, avoid late-night crowd peaks.",
    trust: "Community-flagged",
    openStatus: "Open till 10:00 pm",
    askPrompt: "Give me a safe shopping loop around Laad Bazaar",
    proof: "Why this surfaced: local craft intent match with caution context.",
    coords: { latitude: 17.3607, longitude: 78.4712 },
  },
];

const MAP_STYLE_MUTED = [
  { elementType: "geometry", stylers: [{ color: "#ECEBE6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8B8A84" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ECEBE6" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#DEDCD4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#D9D6CD" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#CFDADF" }] },
];

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function pickState(signals: ExploreSignals, lastStable: ExploreState): { state: ExploreState; trip?: TripRecord } {
  if (!signals.gpsKnown || !signals.currentCoords) {
    return { state: "home" };
  }

  if (signals.gpsConfidence === "weak") {
    return { state: lastStable };
  }

  const current = signals.currentCoords;
  const activeTrip = signals.tripRecords[0];

  if (!activeTrip) {
    return { state: "home" };
  }

  const insideDestination =
    distanceKm(current, activeTrip.destinationCenter) <= activeTrip.geofenceRadiusKm;

  const atHome = distanceKm(current, signals.homeCoords) <= signals.homeRadiusKm;
  const departure = new Date(activeTrip.departureAt).getTime();
  const now = Date.now();
  const departureHours = (departure - now) / 36e5;

  if (insideDestination) {
    return { state: "trip", trip: activeTrip };
  }

  if (atHome && departureHours >= 0 && departureHours <= 48) {
    return { state: "pre-departure", trip: activeTrip };
  }

  return { state: "home" };
}

function uniqueById(items: CardItem[]) {
  const seen = new Set<string>();
  const out: CardItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function toSavedSet(raw: string | null): Set<string> {
  if (!raw) return new Set<string>();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

function trustStyle(chip: TrustChip) {
  if (chip === "Verified") {
    return { backgroundColor: "rgba(25, 102, 78, 0.14)", color: "#0F5D45" };
  }
  if (chip === "Community-flagged") {
    return { backgroundColor: "rgba(146, 79, 35, 0.14)", color: "#8A4A1A" };
  }
  return { backgroundColor: "rgba(42, 42, 42, 0.08)", color: "#444444" };
}

function SheetBackground({ style }: BottomSheetBackgroundProps) {
  return <BlurView style={[style, styles.sheetBackground]} tint="light" intensity={42} />;
}

function DetailSheetBackground({ style }: BottomSheetBackgroundProps) {
  return <View style={[style, styles.detailSheetBackground]} />;
}

function PlaceDetailSheet({
  insets,
  tabBarHeight,
  place,
  saved,
  onSave,
  onAsk,
  onPlan,
  onClose,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  tabBarHeight: number;
  place: CardItem | null;
  saved: Set<string>;
  onSave: (id: string) => void;
  onAsk: (place: CardItem) => void;
  onPlan: (place: CardItem) => void;
  onClose: () => void;
}) {
  const ref = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["68%", "100%"], []);

  useEffect(() => {
    if (place) {
      ref.current?.snapToIndex(0);
    } else {
      ref.current?.close();
    }
  }, [place]);

  const trust = place?.trust ? trustStyle(place.trust) : null;
  const isSaved = place ? saved.has(place.id) : false;

  const previewRegion: Region = {
    latitude: place?.coords?.latitude ?? HOME_COORDS.latitude,
    longitude: place?.coords?.longitude ?? HOME_COORDS.longitude,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  };

  const detailBottomInset = place ? 0 : tabBarHeight + 8;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      topInset={0}
      bottomInset={detailBottomInset}
      style={styles.overlaySheet}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.46}
        />
      )}
      backgroundComponent={DetailSheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
    >
      {place ? (
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.detailContent,
            { paddingBottom: insets.bottom + 14 },
          ]}
        >
          <Image source={{ uri: place.image }} style={styles.detailImage} contentFit="cover" />

          <View style={styles.detailHeadingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailName}>{place.name}</Text>
              <Text style={styles.detailMeta}>
                {place.distance} · {place.travelTime ?? "Road/flight"} · {place.bestTime ?? place.season}
              </Text>
            </View>
            {trust ? (
              <View style={[styles.trustChipCompact, { backgroundColor: trust.backgroundColor }]}> 
                <Text style={[styles.trustText, { color: trust.color }]}>{place.trust}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.detailDescription}>{place.description ?? place.cue}</Text>

          <View style={styles.detailFactBox}>
            <Text style={styles.detailFactTitle}>Feasibility</Text>
            <Text style={styles.detailFactText}>
              Distance: {place.distance} · Travel: {place.travelTime ?? "Road/flight"}
            </Text>
            <Text style={styles.detailFactText}>
              Best time: {place.bestTime ?? place.season} · Season: {place.season}
            </Text>
          </View>

          <Text style={styles.detailProof}>{place.proof ?? "Why this surfaced: matched to your saved patterns."}</Text>

          <View style={styles.detailFactBox}>
            <Text style={styles.detailFactTitle}>Key facts</Text>
            <Text style={styles.detailFactText}>Known for: {place.knownFor ?? "Nature and local culture"}</Text>
            <Text style={styles.detailFactText}>Type: {place.placeType ?? "Destination"}</Text>
            <Text style={styles.detailFactText}>Ideal trip length: {place.idealTripLength ?? "2-3 days"}</Text>
          </View>

          <View style={styles.previewMapWrap}>
            <MapView
              style={styles.previewMap}
              initialRegion={previewRegion}
              region={previewRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              customMapStyle={MAP_STYLE_MUTED}
            >
              {place.coords ? <Marker coordinate={place.coords} pinColor="#2D7A5E" /> : null}
            </MapView>
          </View>

          <View style={styles.detailActionsRow}>
            <Pressable style={styles.detailSaveButton} onPress={() => onSave(place.id)}>
              <Feather name="heart" size={14} color={isSaved ? "#FFFFFF" : "#1F1F1F"} />
              <Text style={[styles.detailSaveText, isSaved && styles.detailSaveTextActive]}>
                {isSaved ? "Saved" : "Save"}
              </Text>
            </Pressable>

            <Pressable style={styles.detailPlanButton} onPress={() => onPlan(place)}>
              <Feather name="map" size={14} color="#FFFFFF" />
              <Text style={styles.detailPlanText}>Plan this trip</Text>
            </Pressable>

            <Pressable style={styles.detailAskButton} onPress={() => onAsk(place)}>
              <Feather name="message-circle" size={14} color="#FFFFFF" />
              <Text style={styles.detailAskText}>Ask Hita</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      ) : null}
    </BottomSheet>
  );
}

function HomeStateView({
  insets,
  tabBarHeight,
  query,
  setQuery,
  runSearch,
  askHita,
  toggleSave,
  saved,
  rows,
  openPlaceDetail,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  tabBarHeight: number;
  query: string;
  setQuery: (value: string) => void;
  runSearch: () => void;
  askHita: (message: string) => void;
  toggleSave: (id: string) => void;
  saved: Set<string>;
  rows: HomeRow[];
  openPlaceDetail: (place: CardItem) => void;
}) {
  return (
    <>
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <BlurView intensity={48} tint="light" style={styles.headerGlass}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Dream and save future trips</Text>

          <Pressable
            onPress={runSearch}
            style={({ pressed }) => [styles.searchPill, pressed && styles.searchPillPressed]}
          >
            <Feather name="search" size={16} color="#5E5E5E" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Where to next? Ask Hita anything"
              placeholderTextColor="#8B8B8B"
              style={styles.searchInput}
              onSubmitEditing={runSearch}
              returnKeyType="search"
            />
            <Feather name="arrow-up-right" size={16} color="#3A3A3A" />
          </Pressable>
        </BlurView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 168, 220),
          paddingBottom: Math.max(insets.bottom + 12, 20),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(40).duration(420)} style={styles.heroShell}>
          <Pressable onPress={() => openPlaceDetail(HERO)}>
            <Image source={{ uri: HERO.image }} style={styles.heroImage} contentFit="cover" />
            <LinearGradient
              colors={["rgba(15,15,15,0)", "rgba(15,15,15,0.45)", "rgba(15,15,15,0.82)"]}
              locations={[0.35, 0.67, 1]}
              style={styles.heroScrim}
            />
          </Pressable>

          <BlurView intensity={22} tint="dark" style={styles.heroGlass}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>This weekend</Text>
              </View>
              {HERO.trust ? (
                <View style={[styles.trustChipCompact, { backgroundColor: "rgba(255,255,255,0.2)" }]}> 
                  <Text style={[styles.trustText, { color: "#F2F2F2" }]}>{HERO.trust}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.heroTitle}>{HERO.name}</Text>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.heroCue}>
              {HERO.cue}
            </Text>
            <Text style={styles.heroMeta}>
              {HERO.distance} · {HERO.season}
            </Text>
            {!!HERO.proof ? (
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.heroProof}>
                {HERO.proof}
              </Text>
            ) : null}

            <View style={styles.heroActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.heroSaveButton,
                  saved.has(HERO.id) && styles.heroSaveButtonActive,
                  pressed && styles.heroSaveButtonPressed,
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  toggleSave(HERO.id);
                }}
              >
                <Feather name="heart" size={16} color={saved.has(HERO.id) ? "#FFFFFF" : "#1C1C1C"} />
                <Text style={[styles.heroSaveText, saved.has(HERO.id) && styles.heroSaveTextActive]}>
                  {saved.has(HERO.id) ? "Saved" : "Save"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.askButton}
                onPress={(event) => {
                  event.stopPropagation();
                  askHita(`Tell me more about ${HERO.name}. ${HERO.askPrompt}`);
                }}
              >
                <Text style={styles.askButtonText}>Ask Hita</Text>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>

        {rows.map((row, rowIndex) => (
          <Animated.View
            key={row.id}
            entering={FadeInDown.delay(120 + rowIndex * 60).duration(360)}
            style={styles.rowBlock}
          >
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <View style={styles.rowChevron}>
                <Text style={styles.rowChevronText}>{row.chevronLabel}</Text>
                <Feather name="chevron-right" size={14} color="#6B6B6B" />
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowList}>
              {row.tiles.map((tile, tileIndex) => {
                const isSaved = saved.has(tile.id);
                const trust = tile.trust ? trustStyle(tile.trust) : null;

                return (
                  <Pressable key={tile.id} style={styles.tile} onPress={() => openPlaceDetail(tile)}>
                    <View style={styles.tileImageWrap}>
                      <Image source={{ uri: tile.image }} style={styles.tileImage} contentFit="cover" />
                      {row.ranked ? (
                        <Text style={styles.rankText}>{String(tileIndex + 1).padStart(2, "0")}</Text>
                      ) : null}
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          toggleSave(tile.id);
                        }}
                        style={[styles.saveIconButtonOnImage, isSaved && styles.saveIconButtonActive]}
                      >
                        <Feather name="heart" size={14} color={isSaved ? "#FFFFFF" : "#242424"} />
                      </Pressable>
                    </View>

                    <BlurView tint="light" intensity={48} style={styles.tileContentStrip}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tileName}>
                        {tile.name}
                      </Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tileMeta}>
                        {tile.distance} · {tile.season}
                      </Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tileCue}>
                        {tile.cue}
                      </Text>
                      {trust ? (
                        <View style={[styles.trustChipCompact, { backgroundColor: trust.backgroundColor }]}> 
                          <Text style={[styles.trustText, { color: trust.color }]}>{tile.trust}</Text>
                        </View>
                      ) : null}
                    </BlurView>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        ))}
      </ScrollView>
    </>
  );
}

function PreDepartureStateView({
  insets,
  query,
  setQuery,
  runSearch,
  askHita,
  trip,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  query: string;
  setQuery: (value: string) => void;
  runSearch: () => void;
  askHita: (message: string) => void;
  trip?: TripRecord;
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 24, 86), paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.preHeaderWrap}>
        <BlurView tint="light" intensity={48} style={styles.preHeaderGlass}>
          <Text style={styles.stateKicker}>PRE-DEPARTURE</Text>
          <Text style={styles.preTitle}>{trip?.destinationName ?? "Upcoming trip"}</Text>
          <Text style={styles.preSubtitle}>{trip?.summary ?? "Your briefing is ready."}</Text>

          <View style={styles.searchPillCompact}>
            <Feather name="search" size={16} color="#5E5E5E" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask Hita about your upcoming trip"
              placeholderTextColor="#8B8B8B"
              style={styles.searchInput}
              onSubmitEditing={runSearch}
              returnKeyType="search"
            />
          </View>
        </BlurView>
      </View>

      <View style={styles.preGrid}>
        {PRE_CARDS.map((card, index) => (
          <Animated.View key={card.id} entering={FadeInDown.delay(80 + index * 50).duration(320)}>
            <Pressable style={styles.preCard} onPress={() => askHita(card.askPrompt)}>
              <Image source={{ uri: card.image }} style={styles.preCardImage} contentFit="cover" />
              <BlurView intensity={48} tint="light" style={styles.preCardOverlay}>
                <Text style={styles.preCardTitle}>{card.name}</Text>
                <Text style={styles.preCardMeta}>
                  {card.distance} · {card.season}
                </Text>
                <Text style={styles.preCardCue}>{card.cue}</Text>
              </BlurView>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function TripStateView({
  insets,
  tabBarHeight,
  query,
  setQuery,
  runSearch,
  askHita,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  tabBarHeight: number;
  query: string;
  setQuery: (value: string) => void;
  runSearch: () => void;
  askHita: (message: string) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedId, setSelectedId] = useState(TRIP_CARDS[0]?.id ?? "");
  const [vegOnly, setVegOnly] = useState(false);
  const snapPoints = useMemo(() => ["24%", "56%", "90%"], []);

  const region: Region = {
    latitude: 17.365,
    longitude: 78.476,
    latitudeDelta: 0.095,
    longitudeDelta: 0.095,
  };

  const selectedCard = useMemo(
    () => TRIP_CARDS.find((card) => card.id === selectedId) ?? TRIP_CARDS[0],
    [selectedId]
  );

  const focusCard = useCallback((card: CardItem) => {
    if (!card.coords) return;
    setSelectedId(card.id);
    mapRef.current?.animateToRegion(
      {
        latitude: card.coords.latitude,
        longitude: card.coords.longitude,
        latitudeDelta: 0.07,
        longitudeDelta: 0.07,
      },
      300
    );
    sheetRef.current?.snapToIndex(1);
  }, []);

  return (
    <View style={styles.tripRoot}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        customMapStyle={MAP_STYLE_MUTED}
        showsUserLocation
      >
        {TRIP_CARDS.map((card) =>
          card.coords ? (
            <Marker
              key={card.id}
              coordinate={card.coords}
              pinColor={card.id === selectedId ? "#2D7A5E" : "#888888"}
              onPress={() => focusCard(card)}
            />
          ) : null
        )}
      </MapView>

      <View style={[styles.tripTopOverlay, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <BlurView intensity={44} tint="light" style={styles.tripSearchGlass}>
          <View style={styles.tripLabelRow}>
            <Text style={styles.stateKicker}>TRIP MODE</Text>
            <View style={styles.arrivalChip}>
              <Text style={styles.arrivalChipText}>Arrived</Text>
            </View>
          </View>
          <View style={styles.searchPillCompact}>
            <Feather name="search" size={16} color="#5E5E5E" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask Hita: safe cafes open now"
              placeholderTextColor="#8B8B8B"
              style={styles.searchInput}
              onSubmitEditing={runSearch}
              returnKeyType="search"
            />
          </View>
        </BlurView>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        bottomInset={tabBarHeight}
        backgroundComponent={SheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetHeading}>Right now, around me</Text>
          {TRIP_CARDS.map((card) => {
            const selected = selectedCard?.id === card.id;
            return (
              <Pressable
                key={card.id}
                onPress={() => focusCard(card)}
                style={[styles.tripCard, selected && styles.tripCardActive]}
              >
                <Image source={{ uri: card.image }} style={styles.tripCardImage} contentFit="cover" />
                <View style={styles.tripCardBody}>
                  <Text style={styles.tripCardName}>{card.name}</Text>
                  <Text style={styles.tripCardMeta}>
                    {card.distance} · {card.openStatus ?? card.season}
                  </Text>
                  <Text style={styles.tripCardCue}>{card.cue}</Text>
                  {!!card.proof && <Text style={styles.tripCardProof}>{card.proof}</Text>}

                  <View style={styles.tripCardFooter}>
                    {card.trust ? (
                      <View style={[styles.trustChipCompact, { backgroundColor: trustStyle(card.trust).backgroundColor }]}> 
                        <Text style={[styles.trustText, { color: trustStyle(card.trust).color }]}>{card.trust}</Text>
                      </View>
                    ) : null}
                    <Pressable style={styles.routeButton} onPress={() => askHita(`Route to ${card.name}`)}>
                      <Feather name="navigation" size={13} color="#FFFFFF" />
                      <Text style={styles.routeButtonText}>Route</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}

          <View style={styles.tripSection}>
            <Text style={styles.tripSectionTitle}>Local essentials</Text>
            <View style={styles.vegToggleRow}>
              <Pressable
                style={[styles.filterChip, vegOnly && styles.filterChipActive]}
                onPress={() => setVegOnly((v) => !v)}
              >
                <Text style={[styles.filterChipText, vegOnly && styles.filterChipTextActive]}>
                  Veg-only
                </Text>
              </Pressable>
              <Text style={styles.tripSectionMeta}>ATM · Pharmacy · SIM · Restrooms · Water</Text>
            </View>
          </View>

          <View style={styles.tripSection}>
            <Text style={styles.tripSectionTitle}>What's next in my day</Text>
            <Text style={styles.tripSectionMeta}>Salar Jung Museum in 18 mins · metro + 6 min walk</Text>
          </View>

          <View style={styles.tripSection}>
            <Text style={styles.tripSectionTitle}>Safety context for this place</Text>
            <Text style={styles.tripSectionMeta}>
              Keep valuables zipped in market lanes after 8:30 pm. Nearest 24h pharmacy: 450m.
            </Text>
          </View>

          <View style={styles.tripSection}>
            <Text style={styles.tripSectionTitle}>Companion check-in</Text>
            <Pressable style={styles.checkinButton} onPress={() => askHita("Help me share a live check-in")}> 
              <Feather name="send" size={14} color="#FFFFFF" />
              <Text style={styles.checkinButtonText}>Send live check-in</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

export default function ExploreTab() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [seededTrips, setSeededTrips] = useState<Set<string>>(new Set());
  const [selectedPlace, setSelectedPlace] = useState<CardItem | null>(null);
  const [lastStableState, setLastStableState] = useState<ExploreState>("home");
  const [showArrivalMoment, setShowArrivalMoment] = useState(false);

  const [signals, setSignals] = useState<ExploreSignals>({
    gpsKnown: false,
    gpsConfidence: "weak",
    homeCoords: HOME_COORDS,
    homeRadiusKm: 8,
    tripRecords: MOCK_TRIPS,
  });

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(SAVE_KEY);
      setSaved(toSavedSet(raw));

      const seededRaw = await SecureStore.getItemAsync(PLAN_KEY);
      setSeededTrips(toSavedSet(seededRaw));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setSignals((prev) => ({ ...prev, gpsKnown: false, gpsConfidence: "weak" }));
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const confidence = current.coords.accuracy && current.coords.accuracy <= 120 ? "high" : "weak";

      setSignals((prev) => ({
        ...prev,
        gpsKnown: true,
        gpsConfidence: confidence,
        currentCoords: {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        },
      }));
    })();
  }, []);

  const resolved = useMemo(() => pickState(signals, lastStableState), [lastStableState, signals]);

  useEffect(() => {
    if (resolved.state !== lastStableState) {
      if (resolved.state === "trip") {
        setShowArrivalMoment(true);
        setTimeout(() => setShowArrivalMoment(false), 2800);
      }
      setLastStableState(resolved.state);
    }
  }, [lastStableState, resolved.state]);

  useEffect(() => {
    if (resolved.state !== "home") {
      setSelectedPlace(null);
    }
  }, [resolved.state]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: selectedPlace ? { display: "none" } : undefined,
    });

    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation, selectedPlace]);

  const persistSaved = useCallback(async (next: Set<string>) => {
    await SecureStore.setItemAsync(SAVE_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const persistSeeded = useCallback(async (next: Set<string>) => {
    await SecureStore.setItemAsync(PLAN_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const toggleSave = useCallback(
    async (id: string) => {
      const next = new Set(saved);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSaved(next);
      await persistSaved(next);
    },
    [persistSaved, saved]
  );

  const askHita = useCallback(
    (initialMessage: string) => {
      router.push({ pathname: "/chat", params: { initialMessage } });
    },
    [router]
  );

  const runSearch = useCallback(() => {
    const trimmed = query.trim();
    askHita(trimmed.length > 0 ? trimmed : "Where to next? Give me one idea and why.");
  }, [askHita, query]);

  const personalizedTiles = useMemo(() => {
    const merged = uniqueById([
      ...PERSONALIZED_POOL,
      ...WEEKEND_TILES.filter((tile) => saved.has(tile.id)),
      ...TRENDING_TILES.filter((tile) => saved.has(tile.id)),
      ...WORLD_TILES.filter((tile) => saved.has(tile.id)),
      ...SEASON_TILES.filter((tile) => saved.has(tile.id)),
    ]);
    return merged.length > 0 ? merged.slice(0, 3) : PERSONALIZED_POOL;
  }, [saved]);

  const rows: HomeRow[] = useMemo(
    () => [
      {
        id: "row_weekend",
        title: "Weekend getaways from Hyderabad",
        chevronLabel: "See all",
        tiles: WEEKEND_TILES,
      },
      {
        id: "row_trending",
        title: "Trending in India now",
        chevronLabel: "Top 10",
        ranked: true,
        tiles: TRENDING_TILES,
      },
      {
        id: "row_world",
        title: "Beautiful places worldwide",
        chevronLabel: "See all",
        tiles: WORLD_TILES,
      },
      {
        id: "row_saved",
        title: `Because you saved ${saved.size > 0 ? saved.size : "places"}`,
        chevronLabel: "For you",
        tiles: personalizedTiles,
      },
      {
        id: "row_season",
        title: "Best in monsoon now",
        chevronLabel: "Seasonal",
        tiles: SEASON_TILES,
      },
    ],
    [personalizedTiles, saved.size]
  );

  const seedTripPlan = useCallback(
    async (place: CardItem) => {
      const next = new Set(seededTrips);
      next.add(place.id);
      setSeededTrips(next);
      await persistSeeded(next);
      setSelectedPlace(null);
    },
    [persistSeeded, seededTrips]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.ambientOrbA} />
        <View style={styles.ambientOrbB} />

        {resolved.state === "home" ? (
          <HomeStateView
            insets={insets}
            tabBarHeight={tabBarHeight}
            query={query}
            setQuery={setQuery}
            runSearch={runSearch}
            askHita={askHita}
            toggleSave={toggleSave}
            saved={saved}
            rows={rows}
            openPlaceDetail={setSelectedPlace}
          />
        ) : null}

        {resolved.state === "pre-departure" ? (
          <PreDepartureStateView
            insets={insets}
            query={query}
            setQuery={setQuery}
            runSearch={runSearch}
            askHita={askHita}
            trip={resolved.trip}
          />
        ) : null}

        {resolved.state === "trip" ? (
          <TripStateView
            insets={insets}
            tabBarHeight={tabBarHeight}
            query={query}
            setQuery={setQuery}
            runSearch={runSearch}
            askHita={askHita}
          />
        ) : null}

        {resolved.state === "home" ? (
          <View pointerEvents="box-none" style={styles.sheetHost}>
            <PlaceDetailSheet
              insets={insets}
              tabBarHeight={tabBarHeight}
              place={selectedPlace}
              saved={saved}
              onSave={toggleSave}
              onAsk={(place) => askHita(`Tell me more about ${place.name}. ${place.askPrompt}`)}
              onPlan={seedTripPlan}
              onClose={() => setSelectedPlace(null)}
            />
          </View>
        ) : null}

        {showArrivalMoment ? (
          <View style={[styles.arrivalMomentWrap, { top: Math.max(insets.top + 12, 28) }]}> 
            <BlurView intensity={52} tint="light" style={styles.arrivalMomentGlass}>
              <Feather name="map-pin" size={15} color="#1F5E49" />
              <Text style={styles.arrivalMomentText}>Welcome to Hyderabad. Guardian mode is ready.</Text>
            </BlurView>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },
  ambientOrbA: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(187, 221, 206, 0.45)",
    zIndex: 0,
  },
  ambientOrbB: {
    position: "absolute",
    top: 90,
    right: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(203, 214, 228, 0.38)",
    zIndex: 0,
  },
  scroll: {
    flex: 1,
  },
  headerWrap: {
    position: "absolute",
    zIndex: 20,
    left: 14,
    right: 14,
  },
  headerGlass: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    overflow: "hidden",
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    marginTop: 4,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: "#696969",
  },
  searchPill: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    gap: 8,
  },
  searchPillPressed: {
    opacity: 0.92,
  },
  searchPillCompact: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  heroShell: {
    marginHorizontal: 14,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.52)",
  },
  heroImage: {
    width: "100%",
    height: 306,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlass: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  heroTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(12, 12, 12, 0.72)",
  },
  heroTagText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 31,
    color: "#F7F7F7",
  },
  heroCue: {
    marginTop: 4,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    color: "#F4F4F4",
  },
  heroMeta: {
    marginTop: 8,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "#EEEEEE",
    letterSpacing: 0.2,
  },
  heroProof: {
    marginTop: 7,
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: "#DFDFDF",
  },
  heroActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroSaveButton: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroSaveButtonPressed: {
    opacity: 0.86,
  },
  heroSaveButtonActive: {
    backgroundColor: "#1F1F1F",
    borderColor: "#1F1F1F",
  },
  heroSaveText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#1C1C1C",
  },
  heroSaveTextActive: {
    color: "#FFFFFF",
  },
  askButton: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  askButtonText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#FFFFFF",
  },
  rowBlock: {
    marginBottom: 20,
  },
  rowHeader: {
    marginHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  rowChevron: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowChevronText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: "#6B6B6B",
  },
  rowList: {
    paddingHorizontal: 14,
    gap: 12,
  },
  tile: {
    width: 202,
    height: 238,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.52)",
    backgroundColor: "rgba(255,255,255,0.62)",
  },
  tileImageWrap: {
    width: "100%",
    height: 136,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  rankText: {
    position: "absolute",
    left: 10,
    top: 10,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: "#FFFFFF",
    backgroundColor: "rgba(18,18,18,0.7)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  saveIconButtonOnImage: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  saveIconButtonActive: {
    backgroundColor: "#1F1F1F",
    borderColor: "#1F1F1F",
  },
  tileContentStrip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.62)",
    overflow: "hidden",
  },
  tileName: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: "#1A1A1A",
  },
  tileMeta: {
    marginTop: 3,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "#2A2A2A",
    letterSpacing: 0.15,
  },
  tileCue: {
    marginTop: 4,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: "#434343",
  },
  trustChipCompact: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trustText: {
    fontFamily: fonts.body,
    fontSize: 10,
  },
  preHeaderWrap: {
    marginHorizontal: 14,
  },
  preHeaderGlass: {
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    overflow: "hidden",
  },
  stateKicker: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "#5F5F5F",
    letterSpacing: 0.5,
  },
  preTitle: {
    marginTop: 5,
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
  },
  preSubtitle: {
    marginTop: 4,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: "#636363",
  },
  preGrid: {
    marginTop: 16,
    gap: 12,
    paddingHorizontal: 14,
  },
  preCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.56)",
    height: 186,
  },
  preCardImage: {
    width: "100%",
    height: "100%",
  },
  preCardOverlay: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.56)",
    padding: 10,
    overflow: "hidden",
  },
  preCardTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
  },
  preCardMeta: {
    marginTop: 3,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "#2F2F2F",
  },
  preCardCue: {
    marginTop: 5,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: "#4E4E4E",
  },
  tripRoot: {
    flex: 1,
  },
  tripTopOverlay: {
    position: "absolute",
    zIndex: 12,
    left: 14,
    right: 14,
  },
  tripSearchGlass: {
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    overflow: "hidden",
  },
  tripLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  arrivalChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(28, 101, 75, 0.16)",
  },
  arrivalChipText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "#1F5E49",
  },
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    overflow: "hidden",
  },
  sheetHandle: {
    backgroundColor: "rgba(79,79,79,0.35)",
    width: 46,
  },
  overlaySheet: {
    zIndex: 200,
    elevation: 200,
  },
  sheetHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 250,
    elevation: 250,
  },
  detailSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(215,215,215,0.8)",
    backgroundColor: "#F4F4F2",
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: 14,
    paddingBottom: 42,
  },
  sheetHeading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tripCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  tripCardActive: {
    borderColor: "rgba(31,94,73,0.34)",
  },
  tripCardImage: {
    width: 102,
    height: 114,
  },
  tripCardBody: {
    flex: 1,
    padding: 10,
  },
  tripCardName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
  },
  tripCardMeta: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "#3F3F3F",
  },
  tripCardCue: {
    marginTop: 5,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: "#545454",
  },
  tripCardProof: {
    marginTop: 6,
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: "#646464",
  },
  tripCardFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "#1F1F1F",
  },
  routeButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.body,
    fontSize: 12,
  },
  tripSection: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  tripSectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.textPrimary,
  },
  tripSectionMeta: {
    marginTop: 5,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: "#545454",
  },
  vegToggleRow: {
    marginTop: 6,
    gap: 8,
  },
  filterChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(31,31,31,0.12)",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  filterChipActive: {
    backgroundColor: "#1F1F1F",
    borderColor: "#1F1F1F",
  },
  filterChipText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "#2E2E2E",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  checkinButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#1F1F1F",
  },
  checkinButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.body,
    fontSize: 12,
  },
  detailContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  detailImage: {
    height: 196,
    width: "100%",
    borderRadius: 16,
  },
  detailHeadingRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  detailName: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  detailMeta: {
    marginTop: 4,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "#2F2F2F",
  },
  detailDescription: {
    marginTop: 10,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
  },
  detailFactBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    backgroundColor: "rgba(255,255,255,0.52)",
  },
  detailFactTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: "#202020",
  },
  detailFactText: {
    marginTop: 4,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: "#383838",
  },
  detailProof: {
    marginTop: 10,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: "#4E4E4E",
  },
  previewMapWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    height: 160,
  },
  previewMap: {
    width: "100%",
    height: "100%",
  },
  detailActionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  detailSaveButton: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(30,30,30,0.16)",
    backgroundColor: "rgba(255,255,255,0.78)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailSaveText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#1F1F1F",
  },
  detailSaveTextActive: {
    color: "#FFFFFF",
  },
  detailPlanButton: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#1F1F1F",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailPlanText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#FFFFFF",
  },
  detailAskButton: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#1F1F1F",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailAskText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#FFFFFF",
  },
  arrivalMomentWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 40,
  },
  arrivalMomentGlass: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  arrivalMomentText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#204B3D",
  },
});
