"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Map, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DishFeatureCollection } from "@/lib/geojson";

interface MapContainerProps {
  geojson: DishFeatureCollection | null;
  height?: string;
  interactive?: boolean;
  initialZoom?: number;
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
      ctx.strokeStyle = "#fbbf24";
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

// Outer glow ring — animated by requestAnimationFrame.
// Filter: only render for dishes WITHOUT an image (fallback dot pattern).
const dishGlowLayer = {
  id: "dish-glow",
  type: "circle" as const,
  source: "dishes",
  filter: [
    "all",
    ["!", ["has", "point_count"]],
    ["!", ["has", "imageUrl"]],
  ] as ExpressionSpecification,
  paint: {
    "circle-radius": 13,
    "circle-color": "#f59e0b",
    "circle-opacity": 0.3,
    "circle-stroke-width": 0,
  },
};

// Inner core dot — static, crisp. Fallback for dishes without an image.
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
    "text-color": "#ffffff",
    "text-halo-color": "rgba(0, 0, 0, 0.85)",
    "text-halo-width": 2,
  },
};

// --- Component ---

export default function MapContainer({ geojson, height = "100vh", interactive = true, initialZoom }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const hoveredId = useRef<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const onMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Pre-render dish thumbnails as circular canvas images and register with the map.
  // Failures are silent — those dishes fall back to the dot layer via the filter.
  useEffect(() => {
    if (!mapLoaded || !geojson) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    let cancelled = false;
    geojson.features.forEach(async (feature) => {
      const url = feature.properties.imageUrl;
      if (!url) return;
      const iconId = `dish-${feature.properties.id}`;
      if (map.hasImage(iconId)) return;
      try {
        const imageData = await loadCircularImage(url);
        // Guard against the map being torn down mid-load (StrictMode double-mount).
        // mapRef.current may now point to a fresh map instance, or the captured
        // map's style may be gone — both would crash mapbox-gl deep in addImage.
        if (
          cancelled ||
          mapRef.current?.getMap() !== map ||
          !map.style ||
          map.hasImage(iconId)
        )
          return;
        map.addImage(iconId, imageData, { pixelRatio: 2 });
      } catch {
        // Fall back to dot rendering via filter.
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mapLoaded, geojson]);

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
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactive={interactive}
      interactiveLayerIds={["clusters", "dish-thumbnails", "dish-glow", "dish-core"]}
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
          <Layer {...dishThumbnailLayer} />
          <Layer {...labelLayer} />
        </Source>
      )}

    </Map>
  );
}
