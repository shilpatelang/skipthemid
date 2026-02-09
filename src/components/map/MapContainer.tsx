"use client";

import { useEffect, useState } from "react";
import { Map, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RestaurantFeatureCollection } from "@/lib/geojson";

const CHARLOTTE_CENTER = { longitude: -80.8431, latitude: 35.2271 };
const DEFAULT_ZOOM = 12;

const restaurantLayer = {
  id: "restaurants",
  type: "circle" as const,
  source: "restaurants",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": 7,
    "circle-color": "#6b7280",
    "circle-stroke-width": 1,
    "circle-stroke-color": "#ffffff",
  },
};

const labelLayer = {
  id: "restaurant-labels",
  type: "symbol" as const,
  source: "restaurants",
  filter: ["!", ["has", "point_count"]],
  layout: {
    "text-field": ["get", "name"] as ["get", string],
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as string[],
    "text-size": 11,
    "text-offset": [0, 1.25] as [number, number],
    "text-anchor": "top" as const,
  },
  paint: {
    "text-color": "#000000", // White text looks better on your dark-v11 style
    "text-halo-color": "",
    "text-halo-width": 0.05,
  },
};

export default function MapContainer() {
  const [geojson, setGeojson] = useState<RestaurantFeatureCollection | null>(
    null
  );

  useEffect(() => {
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        ...CHARLOTTE_CENTER,
        zoom: DEFAULT_ZOOM,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {geojson && (
        <Source id="restaurants" type="geojson" data={geojson}>
          <Layer {...restaurantLayer} />
          <Layer {...labelLayer} />
        </Source>
      )}
    </Map>
  );
}
