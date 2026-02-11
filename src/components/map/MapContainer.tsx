"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Map, Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DishFeatureCollection } from "@/lib/geojson";

interface MapContainerProps {
  geojson: DishFeatureCollection | null;
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
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
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
    "text-color": "#000000",
  },
};

const dishLayer = {
  id: "dishes",
  type: "symbol" as const,
  source: "dishes",
  filter: ["!", ["has", "point_count"]],
  layout: {
    "icon-image": "pin-sdf",
    "icon-size": 1.0,
    "icon-allow-overlap": true,
    "icon-anchor": "bottom" as const,
  },
  paint: {
    "icon-color": "#f59e0b",
    "icon-halo-color": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      "#92400e",
      "transparent",
    ] as ExpressionSpecification,
    "icon-halo-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      2,
      0,
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
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as string[],
    "text-size": 11,
    "text-offset": [0, 0.5] as [number, number],
    "text-anchor": "top" as const,
  },
  paint: {
    "text-color": "#333333",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.5,
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

export default function MapContainer({ geojson }: MapContainerProps) {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const hoveredId = useRef<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.loadImage("/icons/pin.png", (error, image) => {
      if (error) {
        console.error("Failed to load pin icon:", error);
        return;
      }
      if (!map.hasImage("pin-sdf")) {
        map.addImage("pin-sdf", image!, { sdf: true });
      }
      setImageLoaded(true);
    });
  }, []);

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

  const onClick = useCallback(
    (e: MapMouseEvent) => {
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
        router.push(`/dish/${feature.properties.slug}`);
      }
    },
    [router]
  );

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={WORLD_VIEW}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      interactiveLayerIds={["clusters", "dishes"]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onLoad={onMapLoad}
    >
      {geojson && imageLoaded && (
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
          <Layer {...dishLayer} />
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
          offset={[0, -40] as [number, number]}
        >
          <div className="px-2 py-1.5 text-sm">
            <p className="font-semibold text-gray-900">{popupInfo.name}</p>
            <p className="text-xs text-gray-500">
              {popupInfo.cuisine} · {popupInfo.origin}
            </p>
          </div>
        </Popup>
      )}
    </Map>
  );
}
