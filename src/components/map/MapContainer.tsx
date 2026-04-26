"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Map, Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DishFeatureCollection } from "@/lib/geojson";

interface MapContainerProps {
  geojson: DishFeatureCollection | null;
  height?: string;
  interactive?: boolean;
}

const WORLD_VIEW = { longitude: 20, latitude: 20, zoom: 2 };

// --- Layer definitions ---

const clusterLayer = {
  id: "clusters",
  type: "circle" as const,
  source: "dishes",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#fbbf24",
      10,
      "#f59e0b",
      25,
      "#d97706",
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
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "rgba(251, 191, 36, 0.3)",
  },
};

const clusterCountLayer = {
  id: "cluster-count",
  type: "symbol" as const,
  source: "dishes",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"] as ["get", string],
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as string[],
    "text-size": 13,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

// Outer glow ring — animated by requestAnimationFrame
const dishGlowLayer = {
  id: "dish-glow",
  type: "circle" as const,
  source: "dishes",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": 13,
    "circle-color": "#f59e0b",
    "circle-opacity": 0.3,
    "circle-stroke-width": 0,
  },
};

// Inner core dot — static, crisp
const dishCoreLayer = {
  id: "dish-core",
  type: "circle" as const,
  source: "dishes",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": 5,
    "circle-color": "#fbbf24",
    "circle-opacity": 0.9,
    "circle-stroke-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      2.5,
      1.5,
    ] as ExpressionSpecification,
    "circle-stroke-color": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      "#ffffff",
      "#f59e0b",
    ] as ExpressionSpecification,
  },
};

const labelLayer = {
  id: "dish-labels",
  type: "symbol" as const,
  source: "dishes",
  filter: ["!", ["has", "point_count"]],
  layout: {
    "text-field": ["get", "name"] as ["get", string],
    "text-font": ["Noto Serif Bold", "Arial Unicode MS Bold"] as string[],
    "text-size": 14,
    "text-offset": [0, 1.4] as [number, number],
    "text-anchor": "top" as const,
    "text-letter-spacing": 0.05,
  },
  paint: {
    "text-color": "#ffffff",
    "text-halo-color": "rgba(0, 0, 0, 0.85)",
    "text-halo-width": 2,
  },
};

// --- Popup info type ---

type PopupInfo = {
  longitude: number;
  latitude: number;
  name: string;
  cuisine: string;
  origin: string;
};

// --- Component ---

export default function MapContainer({ geojson, height = "100vh", interactive = true }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const hoveredId = useRef<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const onMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Pulse animation for the glow layer
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    let animationId: number;
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const t = Math.sin((elapsed / 2000) * Math.PI * 2);

      const radius = 13 + t * 3;
      const opacity = 0.275 + t * 0.125;

      try {
        if (map!.getLayer("dish-glow")) {
          map!.setPaintProperty("dish-glow", "circle-radius", radius);
          map!.setPaintProperty("dish-glow", "circle-opacity", opacity);
        }
      } catch {
        // Layer may not exist yet during initial render
      }

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mapLoaded]);

  const onMouseEnter = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map || !e.features?.length) return;

    const feature = e.features[0];
    map.getCanvas().style.cursor = "pointer";

    const id = feature.properties?.id ?? feature.id;
    if (id != null) {
      if (hoveredId.current != null) {
        map.setFeatureState(
          { source: "dishes", id: hoveredId.current },
          { hover: false }
        );
      }
      hoveredId.current = String(id);
      map.setFeatureState(
        { source: "dishes", id: hoveredId.current },
        { hover: true }
      );
    }

    if (feature.properties?.cluster) return;

    const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
    setPopupInfo({
      longitude: lng,
      latitude: lat,
      name: feature.properties?.name ?? "",
      cuisine: feature.properties?.cuisine ?? "",
      origin: feature.properties?.origin ?? "",
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.getCanvas().style.cursor = "";
    if (hoveredId.current != null) {
      map.setFeatureState(
        { source: "dishes", id: hoveredId.current },
        { hover: false }
      );
      hoveredId.current = null;
    }
    setPopupInfo(null);
  }, []);

  const onClick = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map || !e.features?.length) return;

    const feature = e.features[0];

    if (feature.properties?.cluster) {
      const source = map.getSource("dishes") as mapboxgl.GeoJSONSource;
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
    } else if (feature.properties?.slug) {
      window.open(
        `/dish/${feature.properties.slug}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={WORLD_VIEW}
      style={{ width: "100%", height }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactive={interactive}
      interactiveLayerIds={["clusters", "dish-glow", "dish-core"]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onLoad={onMapLoad}
    >
      {geojson && (
        <Source
          id="dishes"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
          promoteId="id"
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...dishGlowLayer} />
          <Layer {...dishCoreLayer} />
          <Layer {...labelLayer} />
        </Source>
      )}

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={[0, -15] as [number, number]}
        >
          <div className="px-4 py-3">
            <p className="font-serif text-lg font-bold text-brown">
              {popupInfo.name}
            </p>
            <p className="mt-1 text-sm text-brown">
              {popupInfo.origin}
            </p>
          </div>
        </Popup>
      )}
    </Map>
  );
}
