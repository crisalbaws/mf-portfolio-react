import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotatedmarker';
import * as turf from '@turf/turf';
import { Package, CheckCircle } from 'lucide-react';
import './styles.css';

interface DeliveryState {
  status: 'en_ruta' | 'entregado';
  tiempoRestante: number;
  distanciaRecorrida: number;
}

const LeafletMap: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | any>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const routePointsRef = useRef<[number, number][]>([]);

  const [delivery, setDelivery] = useState<DeliveryState>({
    status: 'en_ruta',
    tiempoRestante: 0,
    distanciaRecorrida: 0,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const startPoint: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        const angle = Math.random() * 360;
        const destination = turf.destination(
          turf.point(startPoint),
          2,
          angle,
          { units: 'kilometers' }
        );

        if (!mapRef.current) {
          mapRef.current = L.map('map').setView(
            [position.coords.latitude, position.coords.longitude],
            15
          );
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        }

        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${startPoint[0]},${startPoint[1]};${destination.geometry.coordinates[0]},${destination.geometry.coordinates[1]}?overview=full&geometries=geojson`
          );
          const data = await response.json();

          if (data.routes && data.routes[0]) {
            const routeCoordinates = data.routes[0].geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
            );

            routePointsRef.current = routeCoordinates;

            if (routeRef.current) {
              mapRef.current?.removeLayer(routeRef.current);
            }

            routeRef.current = L.polyline(routeCoordinates, {
              color: '#4A5568',
              weight: 4,
              opacity: 0.6,
            }).addTo(mapRef.current!);

            mapRef.current?.fitBounds(routeRef.current.getBounds(), {
              padding: [50, 50],
            });

            if (!markerRef.current) {
              const carIcon = L.divIcon({
                html: `
                  <div class="car-marker-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1h-2"></path>
                      <path d="M5 17H3c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1h2"></path>
                      <path d="M21 7v4"></path>
                      <path d="M3 7v4"></path>
                      <path d="M17 15V5c0-1.1-.9-2-2-2H9C7.9 3 7 3.9 7 5v10"></path>
                      <circle cx="7" cy="17" r="2"></circle>
                      <circle cx="17" cy="17" r="2"></circle>
                    </svg>
                  </div>
                `,
                className: 'car-marker',
              });

              markerRef.current = L.marker(routeCoordinates[0], {
                icon: carIcon,
              }).addTo(mapRef.current);
            }

            const distance = data.routes[0].distance / 1000; 
            const speed = 250;
            const duration = distance * 1000 / speed;

            startTimeRef.current = performance.now();

            const animate = (currentTime: number) => {
              const elapsedTime = (currentTime - startTimeRef.current) / 1000;

              if (elapsedTime < duration) {
                const progress = elapsedTime / duration;
                const pointIndex = Math.floor(progress * (routeCoordinates.length - 1));
                const currentPosition = routeCoordinates[pointIndex];

                if (currentPosition) {
                  markerRef.current?.setLatLng(currentPosition);

                  if (pointIndex < routeCoordinates.length - 1) {
                    const nextPosition = routeCoordinates[pointIndex + 1];
                    const bearing = turf.bearing(
                      turf.point([currentPosition[1], currentPosition[0]]),
                      turf.point([nextPosition[1], nextPosition[0]])
                    );
                    markerRef.current?.setRotationAngle(bearing);
                  }

                  setDelivery((prev) => ({
                    ...prev,
                    tiempoRestante: Math.max(0, duration - elapsedTime),
                    distanciaRecorrida: progress * distance,
                  }));
                }

                animationFrameRef.current = requestAnimationFrame(animate);
              } else {
                const lastPosition = routeCoordinates[routeCoordinates.length - 1];
                if (lastPosition) {
                  markerRef.current?.setLatLng(lastPosition);
                }
                setDelivery((prev) => ({
                  ...prev,
                  status: 'entregado',
                  tiempoRestante: 0,
                  distanciaRecorrida: distance,
                }));
              }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
          }
        } catch (error) {
          console.error('Error obteniendo la ruta:', error);
        }
      },
      (error) => {
        console.error('Error obteniendo la ubicación:', error);
        alert('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación.');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="content">
        <div className="card">
          <div className="map-container">
            <div id="map" style={{ height: '100%', width: '100%' }}></div>
          </div>

          <div className="info-panel">
            <div className="info-header">
              <div>
                <h2 className="title">Seguimiento de Entrega</h2>
                <p className="order-number">Pedido #2787-23-8493kf</p>
              </div>
              <div
                className={`status-badge ${delivery.status === 'entregado' ? 'delivered' : 'in-transit'
                  }`}
              >
                {delivery.status === 'entregado' ? 'Entregado' : 'En Ruta'}
              </div>
            </div>

            <div className="status-container">
              <div
                className={`status-icon ${delivery.status === 'entregado' ? 'delivered' : 'in-transit'
                  }`}
              >
                {delivery.status === 'entregado' ? <CheckCircle /> : <Package />}
              </div>
              <div className="status-details">
                <p className="status-title">
                  {delivery.status === 'entregado'
                    ? 'Pedido entregado'
                    : 'En camino a destino'}
                </p>
                <p className="status-text">
                  {delivery.status === 'entregado'
                    ? 'Tu pedido ha sido entregado exitosamente'
                    : `Tiempo estimado: ${Math.ceil(delivery.tiempoRestante)} segundos`}
                </p>
                <p className="status-text">
                  Distancia recorrida: {delivery.distanciaRecorrida.toFixed(2)} km
                </p>
              </div>
            </div>

            {delivery.status === 'entregado' && (
              <div className="confirmation-box">
                <div className="confirmation-header">
                  <CheckCircle />
                  <p className="confirmation-title">Entrega confirmada</p>
                </div>
                <p className="confirmation-time">
                  Entregado el {new Date().toLocaleDateString()} a las{' '}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;
