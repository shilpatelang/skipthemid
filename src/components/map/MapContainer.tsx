"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Map, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RestaurantFeatureCollection } from "@/lib/geojson";

const CHARLOTTE_CENTER = { longitude: -80.8431, latitude: 35.2271 };
const DEFAULT_ZOOM = 12;

// --- Layer definitions ---

const clusterLayer = {
  id: "clusters",
  type: "circle" as const,
  source: "restaurants",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#51bbd6",
      10,
      "#f1f075",
      25,
      "#f28cb1",
    ] as ExpressionSpecification,
    "circle-radius": [
      "step",
      ["get", "point_count"],
      18,
      10,
      24,
      25,
      32,
    ] as ExpressionSpecification,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
};

const clusterCountLayer = {
  id: "cluster-count",
  type: "symbol" as const,
  source: "restaurants",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"] as ["get", string],
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as string[],
    "text-size": 13,
  },
  paint: {
    "text-color": "#000000",
  },
};

const restaurantLayer = {
  id: "restaurants",
  type: "circle" as const,
  source: "restaurants",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      10,
      7,
    ] as ExpressionSpecification,
    "circle-color": "#6b7280",
    "circle-stroke-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      2,
      1,
    ] as ExpressionSpecification,
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
    "text-color": "#333333",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.5,
  },
};

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const hoveredId = useRef<string | null>(null);
  const [geojson, setGeojson] = useState<RestaurantFeatureCollection | null>(
    null
  );

  useEffect(() => {
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  const onMouseEnter = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map || !e.features?.length) return;

    map.getCanvas().style.cursor = "pointer";
    const id = e.features[0].properties?.id ?? e.features[0].id;
    if (id == null) return;

    // Clear previous hover
    if (hoveredId.current != null) {
      map.setFeatureState(
        { source: "restaurants", id: hoveredId.current },
        { hover: false }
      );
    }
    hoveredId.current = String(id);
    map.setFeatureState(
      { source: "restaurants", id: hoveredId.current },
      { hover: true }
    );
  }, []);

  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.getCanvas().style.cursor = "";
    if (hoveredId.current != null) {
      map.setFeatureState(
        { source: "restaurants", id: hoveredId.current },
        { hover: false }
      );
      hoveredId.current = null;
    }
  }, []);

  // Click cluster to zoom in
  const onClick = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map || !e.features?.length) return;

    const feature = e.features[0];
    if (feature.properties?.cluster) {
      const source = map.getSource("restaurants") as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(
        feature.properties.cluster_id,
        (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ],
            zoom,
          });
        }
      );
    }
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        ...CHARLOTTE_CENTER,
        zoom: DEFAULT_ZOOM,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      interactiveLayerIds={["clusters", "restaurants"]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {geojson && (
        <Source
          id="restaurants"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
          promoteId="id"
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...restaurantLayer} />
          <Layer {...labelLayer} />
        </Source>
      )}
    </Map>
  );
}
