'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDeliveryAddress } from '@/lib/address';

const getDeliveryOrderId = (delivery) => {
  if (!delivery) return null;

  const directOrderId = delivery.orderId;

  if (typeof directOrderId === 'string' && directOrderId.trim()) {
    return directOrderId.trim();
  }

  if (directOrderId?.orderId) {
    return directOrderId.orderId;
  }

  const fallbackOrderId =
    delivery.items?.find((item) => typeof item?.orderId === 'string' && item.orderId.trim())?.orderId?.trim() ||
    delivery.orders?.find((order) => typeof order?.orderId === 'string' && order.orderId.trim())?.orderId?.trim();

  return fallbackOrderId || null;
};

const LeafletMapComponent = ({ 
  mapCenter, 
  deliveriesWithCoords, 
  getMarkerIcon, 
  getStatusColor, 
  getStatusIcon, 
  onDeliveryClick 
}) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      
      // Fix for default markers in react-leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  // Simple fallback icon function - use default markers if custom icons fail
  const getSimpleIcon = (status) => {
    if (typeof window === 'undefined') return null;
    
    try {
      return getMarkerIcon(status);
    } catch (error) {
      console.warn('Failed to get custom marker icon, using default:', error);
      return null; // This will use the default Leaflet marker
    }
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {deliveriesWithCoords.map((delivery) => {
        const coords = delivery.mapCoordinates || delivery.coordinates || delivery.customer?.address?.coordinates;

        if (!coords) {
          console.warn('Skipping marker due to missing coordinates', delivery.deliveryId);
          return null;
        }

        const lat = typeof coords.lat === 'number' ? coords.lat : parseFloat(coords.lat);
        const lng = typeof coords.lng === 'number' ? coords.lng : parseFloat(coords.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.warn('Invalid coordinate values encountered', delivery.deliveryId, coords);
          return null;
        }

        return (
          <Marker
            key={delivery._id || delivery.deliveryId}
            position={[lat, lng]}
            icon={getSimpleIcon(delivery.status)}
          >
          <Popup>
            <div className="p-2 max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{delivery.customer.name}</h3>
                <Badge className={`text-xs ${getStatusColor(delivery.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(delivery.status)}
                    {delivery.status}
                  </div>
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <p><strong>Delivery ID:</strong> {delivery.deliveryId}</p>
                <p>
                  <strong>Order ID:</strong>{' '}
                  {getDeliveryOrderId(delivery) || 'No Order ID'}
                </p>
                <p className="whitespace-pre-line break-words">
                  <strong>Address:</strong>{' '}
                  {formatDeliveryAddress(delivery.customer?.address, { multiline: true })}
                </p>
                {delivery.scheduledDate && (
                  <p><strong>Scheduled:</strong> {new Date(delivery.scheduledDate).toLocaleDateString()}</p>
                )}
                {delivery.estimatedTime && (
                  <p><strong>Time Window:</strong> {delivery.estimatedTime}</p>
                )}
                {delivery.driverName && (
                  <p><strong>Driver:</strong> {delivery.driverName}</p>
                )}
                {delivery.vehicleId && (
                  <p><strong>Vehicle:</strong> {delivery.vehicleId}</p>
                )}
              </div>
              
              {onDeliveryClick && (
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onDeliveryClick(delivery)}
                >
                  View Details
                </Button>
              )}
            </div>
          </Popup>
        </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LeafletMapComponent;