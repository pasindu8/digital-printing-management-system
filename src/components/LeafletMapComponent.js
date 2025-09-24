'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
        console.log('Rendering marker for delivery:', delivery.deliveryId, 'at coordinates:', 
          delivery.customer.address.coordinates);
        
        return (
        <Marker
          key={delivery._id || delivery.deliveryId}
          position={[
            delivery.customer.address.coordinates.lat,
            delivery.customer.address.coordinates.lng
          ]}
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
                <p><strong>Order ID:</strong> {delivery.orderId}</p>
                <p><strong>Address:</strong> {delivery.customer.address.street}, {delivery.customer.address.city}</p>
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