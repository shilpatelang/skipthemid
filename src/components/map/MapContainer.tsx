"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Map } from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DishFeatureCollection } from "@/lib/geojson";

interface MapContainerProps {
  geojson: DishFeatureCollection | null;
  height?: string;
  interactive?: boolean;
  initialZoom?: number;
  transparentSpace?: boolean;
}

const WORLD_VIEW = { longitude: 20, latitude: 20, zoom: 2 };

// --- Circular icon loader ---
// Mapbox symbol layers can't apply border-radius to icons, so we pre-render
// each dish image into a circular-cropped canvas and register it as a map image.

async function loadCircularImage(url: string, size = 64): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const dim = size * 2; // 2x for retina
      const r = dim / 2;
      const canvas = document.createElement("canvas");
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, dim, dim);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(r, r, r - 3, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#d96c3b";
      ctx.stroke();
      resolve(ctx.getImageData(0, 0, dim, dim));
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

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
      "#e8a12b",
      10,
      "#d96c3b",
      25,
      "#2d7d78",
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
    "circle-stroke-color": "rgba(255, 255, 255, 0.85)",
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

// Quiet, static fallback for dishes whose thumbnail is still loading or absent.
const dishCoreLayer = {
  id: "dish-core",
  type: "circle" as const,
  source: "dishes",
  filter: [
    "all",
    ["!", ["has", "point_count"]],
    ["!", ["has", "imageUrl"]],
  ] as ExpressionSpecification,
  paint: {
    "circle-radius": 7,
    "circle-color": "#d96c3b",
    "circle-opacity": 0.88,
    "circle-stroke-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      2.5,
      1.5,
    ] as ExpressionSpecification,
    "circle-stroke-color": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      "#1f5e5a",
      "#ffffff",
    ] as ExpressionSpecification,
  },
};

// Circular thumbnail. Filter: only dishes WITH an image string.
// `icon-image` resolves to "dish-<id>", which we register at map load via addImage().
const dishThumbnailLayer = {
  id: "dish-thumbnails",
  type: "symbol" as const,
  source: "dishes",
  filter: [
    "all",
    ["!", ["has", "point_count"]],
    ["has", "imageUrl"],
  ] as ExpressionSpecification,
  layout: {
    "icon-image": ["concat", "dish-", ["get", "id"]] as ExpressionSpecification,
    "icon-size": 0.5,
    "icon-allow-overlap": true,
    "icon-anchor": "center" as const,
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
    "text-offset": [
      "case",
      ["has", "imageUrl"],
      ["literal", [0, 2.0]],
      ["literal", [0, 1.4]],
    ] as ExpressionSpecification,
    "text-anchor": "top" as const,
    "text-letter-spacing": 0.05,
  },
  paint: {
    "text-color": "#263b37",
    "text-halo-color": "rgba(255, 255, 255, 0.95)",
    "text-halo-width": 2.5,
  },
};

// --- Component ---

export default function MapContainer({
  geojson,
  height = "100vh",
  interactive = true,
  initialZoom,
  transparentSpace = false,
}: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const hoveredId = useRef<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.setFog({
        color: transparentSpace ? "rgba(255, 250, 242, 0)" : "#fffaf2",
        "high-color": transparentSpace ? "rgba(217, 239, 235, 0)" : "#d9efeb",
        "horizon-blend": transparentSpace ? 0 : 0.08,
        "space-color": transparentSpace ? "rgba(255, 250, 242, 0)" : "#fffaf2",
        "star-intensity": 0,
      });
    }
    setMapLoaded(true);
  }, [transparentSpace]);

  // Register thumbnails before adding their symbol layer, then manage the
  // source imperatively. react-map-gl's
  // <Source> cleanup removes and recreates the source when React Strict Mode
  // replays effects in development. Mapbox can then update globe terrain
  // against a half-torn-down style, which throws during route transitions.
  useEffect(() => {
    if (!mapLoaded || !geojson) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    let cancelled = false;
    let detachStyleListener = () => {};

    const prepareDishLayers = async () => {
      const registeredImageIds = new Set<string>();

      await Promise.all(
        geojson.features.map(async (feature) => {
          const url = feature.properties.imageUrl;
          if (!url) return;

          const iconId = `dish-${feature.properties.id}`;
          if (map.hasImage(iconId)) {
            registeredImageIds.add(feature.properties.id);
            return;
          }

          try {
            const imageData = await loadCircularImage(url);
            if (
              cancelled ||
              mapRef.current?.getMap() !== map ||
              !map.style
            )
              return;
            if (!map.hasImage(iconId)) {
              map.addImage(iconId, imageData, { pixelRatio: 2 });
            }
            registeredImageIds.add(feature.properties.id);
          } catch {
            // A failed asset remains on the quiet dot fallback.
          }
        })
      );

      if (cancelled || mapRef.current?.getMap() !== map || !map.style) return;

      const mapData: DishFeatureCollection = {
        ...geojson,
        features: geojson.features.map((feature) => {
          if (
            !feature.properties.imageUrl ||
            registeredImageIds.has(feature.properties.id)
          ) {
            return feature;
          }
          const properties = { ...feature.properties };
          delete properties.imageUrl;
          return { ...feature, properties };
        }),
      };

      const source = map.getSource("dishes") as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(mapData);
      } else {
        map.addSource("dishes", {
          type: "geojson",
          data: mapData,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
          promoteId: "id",
        });
      }

      const layers = [
        clusterLayer,
        clusterCountLayer,
        dishCoreLayer,
        dishThumbnailLayer,
        labelLayer,
      ];
      for (const layer of layers) {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer as mapboxgl.LayerSpecification);
        }
      }
      map.triggerRepaint();
    };

    if (map.isStyleLoaded()) {
      void prepareDishLayers();
    } else {
      map.once("style.load", prepareDishLayers);
      detachStyleListener = () => map.off("style.load", prepareDishLayers);
    }

    return () => {
      cancelled = true;
      detachStyleListener();
    };
  }, [geojson, mapLoaded]);

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
      initialViewState={{ ...WORLD_VIEW, zoom: initialZoom ?? WORLD_VIEW.zoom }}
      style={{ width: "100%", height }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      projection={{ name: "globe" }}
      interactive={interactive}
      interactiveLayerIds={["clusters", "dish-thumbnails", "dish-core"]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onLoad={onMapLoad}
    />
  );
}
