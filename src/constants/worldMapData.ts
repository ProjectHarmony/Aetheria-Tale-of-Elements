// AETHERIA - World Map Data (COMPLETE)
// Source: Aetheria world atlas (v2.1.0), full 61/61 locations, validated
// reciprocal/reachable from Crown Haven City. Kept verbatim as the raw source
// of truth — app/src/constants/maps.ts transforms this into the game's
// MapDef shape (scaling, direction-letter mapping, portal labels, etc.).

export interface RawWarpPortal {
  id: string;
  direction: 'North' | 'South' | 'East' | 'West';
  position: [number, number];
  targetMap: string;
  connectionType?: string;
}

export interface RawLandmark {
  name: string;
  position: [number, number];
}

export interface RawMapEntry {
  mapId: string;
  mapName: string;
  size: [number, number];
  weather: string;
  terrain: Record<string, number>;
  warpPortals: RawWarpPortal[];
  landmarks?: RawLandmark[];
  minimapRequired?: boolean;
  freeMovement?: boolean;
  notes?: string;
}

export const WORLD_MAP_DATA: Record<string, RawMapEntry> = {
  "crown_haven_city": {
    "mapId": "crown_haven_city",
    "mapName": "Crown Haven City",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 35, "road": 20, "cityStructures": 20, "river": 10, "forestBorder": 10, "cliff": 5 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "greenmeadow_plains" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "sunflower_fields" },
      { "id": "wp_south", "direction": "South", "position": [33, 98], "targetMap": "south_crown_haven" },
      { "id": "wp_south_branch", "direction": "South", "position": [66, 96], "targetMap": "pebble_creek" }
    ],
    "landmarks": [
      { "name": "Central Plaza", "position": [50, 45] },
      { "name": "Fountain", "position": [50, 45] },
      { "name": "West Watchtower", "position": [10, 50] },
      { "name": "East Watchtower", "position": [90, 50] },
      { "name": "Stone Bridge", "position": [20, 55] }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "green_meadow_woods": {
    "mapId": "green_meadow_woods",
    "mapName": "Green Meadow Woods",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 45, "grass": 35, "road": 10, "misc": 10 },
    "warpPortals": [
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "greenmeadow_plains" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "moonshade_grove" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "stonegate_raven" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "greenmeadow_plains": {
    "mapId": "greenmeadow_plains",
    "mapName": "Greenmeadow Plains",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "grass": 55, "road": 15, "forestPatch": 15, "plains_detail": 10, "misc": 5 },
    "warpPortals": [
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "crown_haven_city" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "green_meadow_woods" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "whispering_woods" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "crownhaven_quarry": {
    "mapId": "crownhaven_quarry",
    "mapName": "Crownhaven Quarry",
    "size": [100, 100],
    "weather": "Dusty / Clear",
    "terrain": { "rock": 45, "grass": 25, "road": 15, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crownhaven_field" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "blooming_grassfield" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "crownhaven_church_ruin" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "sunflower_fields": {
    "mapId": "sunflower_fields",
    "mapName": "Sunflower Fields",
    "size": [100, 100],
    "weather": "Sunny",
    "terrain": { "grass": 35, "sunflowerField": 30, "road": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crown_haven_city" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "blooming_grassfield" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "crownhaven_field" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "crystal_brook_north" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "south_crown_haven": {
    "mapId": "south_crown_haven",
    "mapName": "South Crown Haven",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 35, "road": 25, "stoneFence": 10, "forestPatch": 15, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "crown_haven_city" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "pebble_creek" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "crownhaven_field" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "forgotten_orchard" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "pebble_creek": {
    "mapId": "pebble_creek",
    "mapName": "Pebble Creek",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 45, "water": 20, "pebbleBank": 15, "road": 10, "forestPatch": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "crown_haven_city" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crystal_brook_south" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "south_crown_haven" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "crownhaven_field": {
    "mapId": "crownhaven_field",
    "mapName": "Crownhaven Field",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 50, "road": 25, "forestPatch": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "south_crown_haven" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "crownhaven_quarry" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "sunflower_fields" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "blooming_grassfield": {
    "mapId": "blooming_grassfield",
    "mapName": "Blooming Grassfield",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 40, "wildflower": 30, "road": 15, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "sunflower_fields" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "crownhaven_quarry" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "blooming_plateau" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "forgotten_orchard": {
    "mapId": "forgotten_orchard",
    "mapName": "Forgotten Orchard",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "orchardRows": 40, "grass": 35, "road": 10, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "south_crown_haven" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "forgotten_orchard_grave" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "verdant_geysers_valley" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "crystal_brook_south": {
    "mapId": "crystal_brook_south",
    "mapName": "Crystal Brook (South)",
    "size": [100, 100],
    "weather": "Misty",
    "terrain": { "grass": 40, "water": 25, "forestPatch": 20, "pebbleBank": 15 },
    "warpPortals": [
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "pebble_creek" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "south_raven_wood" }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "whispering_woods": {
    "mapId": "whispering_woods",
    "mapName": "Whispering Woods",
    "size": [100, 100],
    "weather": "Foggy",
    "terrain": { "forest": 50, "grass": 25, "road": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "ironstone_pass" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "moonshade_grove" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "greenmeadow_plains" }
    ],
    "landmarks": [{ "name": "Whispering Hollow", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "moonshade_grove": {
    "mapId": "moonshade_grove",
    "mapName": "Moonshade Grove",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "forest": 45, "grass": 30, "road": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "raven_forest_ice_wood" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "whispering_woods" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "green_meadow_woods" }
    ],
    "landmarks": [{ "name": "Silver-Leaf Clearing", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "stonegate_raven": {
    "mapId": "stonegate_raven",
    "mapName": "Stonegate Raven",
    "size": [100, 100],
    "weather": "Windy",
    "terrain": { "grass": 35, "desertScrub": 25, "road": 20, "forestPatch": 10, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "stonegate_oasis" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "south_raven_wood" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "green_meadow_woods" }
    ],
    "landmarks": [{ "name": "Desert-Grass Transition Ridge", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "blooming_plateau": {
    "mapId": "blooming_plateau",
    "mapName": "Blooming Plateau",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 40, "wildflower": 25, "road": 20, "cliff": 10, "misc": 5 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "blooming_grassfield" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "windmill_hills" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "silverbrook_city" }
    ],
    "landmarks": [{ "name": "Overlook Ridge", "position": [50, 30] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "crownhaven_church_ruin": {
    "mapId": "crownhaven_church_ruin",
    "mapName": "Crownhaven Church Ruin",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "ruinStructure": 30, "grass": 35, "road": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crownhaven_quarry" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "silverbrook_field" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "ancient_quarry" }
    ],
    "landmarks": [
      { "name": "Collapsed Cathedral Nave", "position": [50, 45] },
      { "name": "Overgrown Bell Tower", "position": [55, 40] }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "forgotten_orchard_grave": {
    "mapId": "forgotten_orchard_grave",
    "mapName": "Forgotten Orchard Grave",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "graveyard": 35, "grass": 35, "orchardRows": 15, "road": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "forgotten_orchard" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "emerald_forest" }
    ],
    "landmarks": [{ "name": "Old Grave Rows", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_geysers_valley": {
    "mapId": "verdant_geysers_valley",
    "mapName": "Verdant Geysers Valley",
    "size": [100, 100],
    "weather": "Steamy",
    "terrain": { "grass": 30, "geyserPool": 30, "mineralRock": 20, "road": 20 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "forgotten_orchard" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "verdant_hotspring" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "verdant_volcano" }
    ],
    "landmarks": [{ "name": "Great Geyser", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "south_raven_wood": {
    "mapId": "south_raven_wood",
    "mapName": "South Raven Wood",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 45, "grass": 35, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "stonegate_raven" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "crystal_brook_south" }
    ],
    "landmarks": [{ "name": "Shadowed Grove Edge", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "crystal_brook_north": {
    "mapId": "crystal_brook_north",
    "mapName": "Crystal Brook (North)",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 40, "water": 30, "pebbleBank": 15, "road": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "frostpine_ridge" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "windmill_hills" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "sunflower_fields" }
    ],
    "landmarks": [{ "name": "Brookside Crossing", "position": [50, 50] }],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_castle": {
    "mapId": "verdant_castle",
    "mapName": "Verdant Castle",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 30, "cityStructures": 30, "road": 25, "forestBorder": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "verdant_forest_entrance" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "verdant_hollow" }
    ],
    "landmarks": [
      { "name": "Verdant Castle Keep", "position": [50, 50] },
      { "name": "Southern Gatehouse", "position": [50, 20] }
    ],
    "minimapRequired": true,
    "freeMovement": true
  },
  "tempest": {
    "mapId": "tempest",
    "mapName": "Tempest (Underwater Cave)",
    "size": [100, 100],
    "weather": "N/A - Submerged",
    "terrain": { "caveFloor": 40, "water": 35, "bioluminescentRock": 15, "rubble": 10 },
    "warpPortals": [
      { "id": "wp_entrance", "direction": "South", "position": [50, 98], "targetMap": "obsidian_ravine" }
    ],
    "landmarks": [
      { "name": "Sunken Chamber", "position": [50, 40] },
      { "name": "Bioluminescent Pool", "position": [50, 60] }
    ],
    "minimapRequired": true,
    "freeMovement": true,
    "notes": "Submerged dungeon map. Access via sea route from Obsidian Ravine. Consider swim/breath mechanics or a submersible transition when this map is populated later."
  },
  "ancient_dragon_spine_nest": {
    "mapId": "ancient_dragon_spine_nest",
    "mapName": "Ancient Dragon Spine Nest",
    "size": [100, 100],
    "weather": "Ominous",
    "terrain": { "rock": 45, "ash": 25, "road": 15, "misc": 15 },
    "warpPortals": [
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "dragon_spine_peak", "connectionType": "mountain_pass" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "ancient_quarry": {
    "mapId": "ancient_quarry",
    "mapName": "Ancient Quarry",
    "size": [100, 100],
    "weather": "Dusty",
    "terrain": { "rock": 45, "grass": 25, "road": 15, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "crownhaven_church_ruin", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "echo_quarry", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "filpine_shorelines", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "crimson_entrance": {
    "mapId": "crimson_entrance",
    "mapName": "Crimson Entrance",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "grass": 40, "road": 25, "stoneStructure": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "verdant_hotspring", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "verdant_forest_entrance", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "dragon_spine_peak": {
    "mapId": "dragon_spine_peak",
    "mapName": "Dragon Spine Peak",
    "size": [100, 100],
    "weather": "Snow",
    "terrain": { "snow": 40, "rock": 35, "mountainPath": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "ancient_dragon_spine_nest", "connectionType": "mountain_pass" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "obsidian_ravine", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "silent_highlands", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "echo_quarry": {
    "mapId": "echo_quarry",
    "mapName": "Echo Quarry",
    "size": [100, 100],
    "weather": "Dusty",
    "terrain": { "rock": 45, "grass": 25, "road": 15, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "emerald_forest", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "ancient_quarry", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "eldoria_island": {
    "mapId": "eldoria_island",
    "mapName": "Eldoria Island",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 30, "sand": 25, "rock": 25, "road": 10, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "ruins_of_eldoria", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "eldoria_shore", "connectionType": "sea" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "eldoria_shore": {
    "mapId": "eldoria_shore",
    "mapName": "Eldoria Shore",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "sand": 35, "grass": 30, "water": 15, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "eldoria_island", "connectionType": "sea" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "stonegate_shore", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "emerald_forest": {
    "mapId": "emerald_forest",
    "mapName": "Emerald Forest",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 50, "grass": 30, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "forgotten_orchard_grave", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "echo_quarry", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "verdant_deep_forest", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "emerald_high_grass": {
    "mapId": "emerald_high_grass",
    "mapName": "Emerald High Grass",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 55, "road": 20, "forestPatch": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "verdant_deep_forest", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "emerald_marshwood", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "emerald_marshwood": {
    "mapId": "emerald_marshwood",
    "mapName": "Emerald Marshwood",
    "size": [100, 100],
    "weather": "Humid",
    "terrain": { "marshWater": 35, "grass": 30, "reed": 20, "road": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "emerald_high_grass", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "filpine_shorelines", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "fallen_watch_tower": {
    "mapId": "fallen_watch_tower",
    "mapName": "Fallen Watch Tower",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "ruinStructure": 30, "grass": 35, "road": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "silent_highlands", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "windmill_hills", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "silverbrook_city", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "filpine_coast": {
    "mapId": "filpine_coast",
    "mapName": "Filpine Coast",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "sand": 35, "grass": 30, "water": 15, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "filpine_shorelines", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "verdant_hollow", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "filpine_forgotten_island", "connectionType": "sea" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "filpine_forgotten_island": {
    "mapId": "filpine_forgotten_island",
    "mapName": "Filpine Forgotten Island",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 30, "sand": 25, "rock": 25, "road": 10, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "filpine_coast", "connectionType": "sea" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "filpine_shorelines": {
    "mapId": "filpine_shorelines",
    "mapName": "Filpine Shorelines",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "sand": 35, "grass": 30, "water": 15, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "ancient_quarry", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "emerald_marshwood", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "filpine_coast", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "forgotten_bastion": {
    "mapId": "forgotten_bastion",
    "mapName": "Forgotten Bastion",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "ruinStructure": 30, "grass": 35, "road": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "silverbrook_city", "connectionType": "road" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "obsidian_ravine", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "shattered_cliffs", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "frostpine_ridge": {
    "mapId": "frostpine_ridge",
    "mapName": "Frostpine Ridge",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 50, "grass": 30, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "mistvale_valley", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "crystal_brook_north", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "ironstone_pass": {
    "mapId": "ironstone_pass",
    "mapName": "Ironstone Pass",
    "size": [100, 100],
    "weather": "Windy",
    "terrain": { "rock": 40, "snow": 20, "road": 25, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "mistvale_mountain", "connectionType": "mountain_pass" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "whispering_woods", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "mistvale_glacier": {
    "mapId": "mistvale_glacier",
    "mapName": "Mistvale Glacier",
    "size": [100, 100],
    "weather": "Snow",
    "terrain": { "snow": 40, "rock": 35, "mountainPath": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "mistvale_mountain_peak", "connectionType": "mountain_pass" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "raven_forest_ice_wood", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "mistvale_mountain": {
    "mapId": "mistvale_mountain",
    "mapName": "Mistvale Mountain",
    "size": [100, 100],
    "weather": "Snow",
    "terrain": { "snow": 40, "rock": 35, "mountainPath": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "mistvale_mountain_peak", "connectionType": "mountain_pass" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "ironstone_pass", "connectionType": "mountain_pass" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "mistvale_mountain_peak": {
    "mapId": "mistvale_mountain_peak",
    "mapName": "Mistvale Mountain Peak",
    "size": [100, 100],
    "weather": "Snow",
    "terrain": { "snow": 40, "rock": 35, "mountainPath": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_south", "direction": "South", "position": [25, 98], "targetMap": "mistvale_glacier", "connectionType": "mountain_pass" },
      { "id": "wp_south_1", "direction": "South", "position": [50, 98], "targetMap": "mistvale_mountain", "connectionType": "mountain_pass" },
      { "id": "wp_south_2", "direction": "South", "position": [75, 98], "targetMap": "mistvale_valley", "connectionType": "mountain_pass" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "mistvale_valley": {
    "mapId": "mistvale_valley",
    "mapName": "Mistvale Valley",
    "size": [100, 100],
    "weather": "Cold",
    "terrain": { "snow": 25, "grass": 35, "rock": 20, "road": 20 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "mistvale_mountain_peak", "connectionType": "mountain_pass" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "frostpine_ridge", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "north_raven_entrance": {
    "mapId": "north_raven_entrance",
    "mapName": "North Raven Entrance",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "grass": 40, "road": 25, "stoneStructure": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "stonegate_beach", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "raven_forest_ice_wood", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "obsidian_ravine": {
    "mapId": "obsidian_ravine",
    "mapName": "Obsidian Ravine",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "rock": 45, "water": 20, "road": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "dragon_spine_peak", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "forgotten_bastion", "connectionType": "road" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "tempest", "connectionType": "sea" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "raven_forest_ice_wood": {
    "mapId": "raven_forest_ice_wood",
    "mapName": "Raven Forest Ice Wood",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 50, "grass": 30, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "mistvale_glacier", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "north_raven_entrance", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "moonshade_grove", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "ruins_of_eldoria": {
    "mapId": "ruins_of_eldoria",
    "mapName": "Ruins of Eldoria",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "ruinStructure": 30, "grass": 35, "road": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "eldoria_island", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "shattered_cliffs": {
    "mapId": "shattered_cliffs",
    "mapName": "Shattered Cliffs",
    "size": [100, 100],
    "weather": "Windy",
    "terrain": { "rock": 55, "grass": 20, "road": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "forgotten_bastion", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "silent_highlands": {
    "mapId": "silent_highlands",
    "mapName": "Silent Highlands",
    "size": [100, 100],
    "weather": "Windy",
    "terrain": { "grass": 45, "rock": 25, "road": 20, "misc": 10 },
    "warpPortals": [
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "dragon_spine_peak", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "fallen_watch_tower", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "silverbrook_city": {
    "mapId": "silverbrook_city",
    "mapName": "Silverbrook City",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 30, "cityStructures": 30, "road": 25, "misc": 15 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "fallen_watch_tower", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "blooming_plateau", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "silverbrook_field", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "forgotten_bastion", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "silverbrook_field": {
    "mapId": "silverbrook_field",
    "mapName": "Silverbrook Field",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 55, "road": 20, "forestPatch": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crownhaven_church_ruin", "connectionType": "road" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "silverbrook_city", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "stonegate_beach": {
    "mapId": "stonegate_beach",
    "mapName": "Stonegate Beach",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "sand": 35, "grass": 30, "water": 15, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "stonegate_desert", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "north_raven_entrance", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "stonegate_desert": {
    "mapId": "stonegate_desert",
    "mapName": "Stonegate Desert",
    "size": [100, 100],
    "weather": "Hot",
    "terrain": { "sand": 55, "rock": 20, "road": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "stonegate_beach", "connectionType": "road" },
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "stonegate_shore", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "stonegate_oasis", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "stonegate_oasis": {
    "mapId": "stonegate_oasis",
    "mapName": "Stonegate Oasis",
    "size": [100, 100],
    "weather": "Hot",
    "terrain": { "sand": 55, "rock": 20, "road": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [33, 2], "targetMap": "stonegate_desert", "connectionType": "road" },
      { "id": "wp_north_1", "direction": "North", "position": [66, 2], "targetMap": "stonegate_shore", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "stonegate_raven", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "stonegate_shore": {
    "mapId": "stonegate_shore",
    "mapName": "Stonegate Shore",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "sand": 35, "grass": 30, "water": 15, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "eldoria_shore", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "stonegate_desert", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "stonegate_oasis", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_deep_forest": {
    "mapId": "verdant_deep_forest",
    "mapName": "Verdant Deep Forest",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 50, "grass": 30, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "verdant_hotspring", "connectionType": "road" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "emerald_forest", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "emerald_high_grass", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "verdant_forest_entrance", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_forest_entrance": {
    "mapId": "verdant_forest_entrance",
    "mapName": "Verdant Forest Entrance",
    "size": [100, 100],
    "weather": "Overcast",
    "terrain": { "grass": 40, "road": 25, "stoneStructure": 20, "misc": 15 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crimson_entrance", "connectionType": "road" },
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "verdant_deep_forest", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "verdant_hollow", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "verdant_castle", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_hollow": {
    "mapId": "verdant_hollow",
    "mapName": "Verdant Hollow",
    "size": [100, 100],
    "weather": "Partly Cloudy",
    "terrain": { "forest": 50, "grass": 30, "road": 15, "misc": 5 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "verdant_forest_entrance", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "filpine_coast", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "verdant_castle", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_hotspring": {
    "mapId": "verdant_hotspring",
    "mapName": "Verdant Hotspring",
    "size": [100, 100],
    "weather": "Steamy",
    "terrain": { "grass": 30, "geyserPool": 30, "mineralRock": 20, "road": 20 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "verdant_geysers_valley", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "verdant_deep_forest", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "crimson_entrance", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "verdant_volcano": {
    "mapId": "verdant_volcano",
    "mapName": "Verdant Volcano",
    "size": [100, 100],
    "weather": "Ashfall",
    "terrain": { "lavaRock": 40, "ash": 30, "rock": 20, "road": 10 },
    "warpPortals": [
      { "id": "wp_north", "direction": "North", "position": [50, 2], "targetMap": "verdant_geysers_valley", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  },
  "windmill_hills": {
    "mapId": "windmill_hills",
    "mapName": "Windmill Hills",
    "size": [100, 100],
    "weather": "Clear",
    "terrain": { "grass": 55, "road": 20, "forestPatch": 15, "misc": 10 },
    "warpPortals": [
      { "id": "wp_west", "direction": "West", "position": [2, 50], "targetMap": "crystal_brook_north", "connectionType": "road" },
      { "id": "wp_east", "direction": "East", "position": [98, 50], "targetMap": "fallen_watch_tower", "connectionType": "road" },
      { "id": "wp_south", "direction": "South", "position": [50, 98], "targetMap": "blooming_plateau", "connectionType": "road" }
    ],
    "landmarks": [],
    "minimapRequired": true,
    "freeMovement": true
  }
};

export default WORLD_MAP_DATA;
