'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import React from 'react';

type Props = {
  lat: number;
  lng: number;
  title?: string;
  heightClass?: string;
  interactive?: boolean;
};

export default function LodgingMap({
  lat,
  lng,
  title,
  heightClass = 'h-80',
  interactive = true,
}: Props) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const styleUrl = `https://api.maptiler.com/maps/basic/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: 12,
      interactive,
    });
    mapRef.current = map;

    const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []); 

  React.useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLngLat([lng, lat]);
    map.easeTo({ center: [lng, lat], duration: 800 });
  }, [lat, lng]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (interactive) {
      map.boxZoom.enable();
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.dragRotate.enable();
      map.keyboard.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    } else {
      map.boxZoom.disable();
      map.scrollZoom.disable();
      map.dragPan.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    }
  }, [interactive]);

  return (
    <div className={`${heightClass} w-full rounded-lg overflow-hidden`}>
      <div ref={mapContainerRef} className="h-full w-full" aria-label={title} />
    </div>
  );
}
