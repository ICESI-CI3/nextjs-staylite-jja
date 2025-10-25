'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import React from 'react';

type Props = {
  lat: number;
  lng: number;
  title?: string;
  heightClass?: string;
};

export default function LodgingMap({ lat, lng, title, heightClass = 'h-80' }: Props) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,  
      style: `https://api.maptiler.com/maps/basic/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
      center: [lng, lat],  
      zoom: 8,  
    });

    new maplibregl.Marker()
      .setLngLat([lng, lat])  
      .addTo(map);

    return () => map.remove();  
  }, [lat, lng]);

  return (
    <div className={`${heightClass} w-full rounded-lg overflow-hidden`}>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
