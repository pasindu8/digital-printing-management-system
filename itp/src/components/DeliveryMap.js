'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Truck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Import leaflet CSS
import 'leaflet/dist/leaflet.css';

// Dynamically import the entire react-leaflet library to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="p-10 flex items-center justify-center border rounded-md bg-gray-50 h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold mb-2">Loading Map...</h3>
        <p className="text-muted-foreground">Preparing delivery locations for display.</p>
      </div>
    </div>
  )
});

// Custom hook for Leaflet icons
const useLeafletIcons = () => {
  const [icons, setIcons] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');

      // Create custom icons for different delivery statuses
      const createIcon = (color) => new L.DivIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      setIcons({
        scheduled: createIcon('#3b82f6'), // blue
        inTransit: createIcon('#f59e0b'), // amber
        delivered: createIcon('#10b981'), // green
        failed: createIcon('#ef4444'), // red
        cancelled: createIcon('#6b7280') // gray
      });
    }
  }, []);

  return icons;
};

const DeliveryMap = ({ deliveries, onDeliveryClick }) => {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [isClient, setIsClient] = useState(false);
  const icons = useLeafletIcons();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate center based on delivery locations
  useEffect(() => {
    if (deliveries && deliveries.length > 0) {
      const validDeliveries = deliveries.filter(d => 
        d.customer?.address?.coordinates?.lat && d.customer?.address?.coordinates?.lng
      );
      
      if (validDeliveries.length > 0) {
        const avgLat = validDeliveries.reduce((sum, d) => sum + d.customer.address.coordinates.lat, 0) / validDeliveries.length;
        const avgLng = validDeliveries.reduce((sum, d) => sum + d.customer.address.coordinates.lng, 0) / validDeliveries.length;
        setMapCenter([avgLat, avgLng]);
      }
    }
  }, [deliveries]);

  // Create a key that changes when deliveries change to force map re-render
  const mapKey = `map-${deliveries?.length || 0}-${JSON.stringify(deliveries?.map(d => d._id || d.deliveryId) || [])}`;

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="p-10 flex items-center justify-center border rounded-md bg-gray-50 h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Loading Map...</h3>
          <p className="text-muted-foreground">Preparing delivery locations for display.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in transit': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'in transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getMarkerIcon = (status) => {
    if (!icons) return null;
    
    switch (status?.toLowerCase()) {
      case 'scheduled': return icons.scheduled;
      case 'in transit': return icons.inTransit;
      case 'delivered': return icons.delivered;
      case 'failed': return icons.failed;
      case 'cancelled': return icons.cancelled;
      default: return icons.scheduled;
    }
  };

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="p-10 flex items-center justify-center border rounded-md bg-gray-50 h-[400px]">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Deliveries to Display</h3>
          <p className="text-muted-foreground">Add some deliveries to see them on the map.</p>
          <p className="text-sm text-gray-400 mt-2">Received {deliveries ? deliveries.length : 0} deliveries</p>
        </div>
      </div>
    );
  }

  // Filter deliveries that have coordinates
  const deliveriesWithCoords = deliveries.filter(d => {
    const hasCoords = d.customer?.address?.coordinates?.lat && d.customer?.address?.coordinates?.lng;
    if (hasCoords) {
      const lat = parseFloat(d.customer.address.coordinates.lat);
      const lng = parseFloat(d.customer.address.coordinates.lng);
      const validCoords = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      if (!validCoords) {
        console.warn('Invalid coordinates for delivery:', d.deliveryId, { lat, lng });
      }
      return validCoords;
    }
    return false;
  });
  
  if (deliveriesWithCoords.length === 0) {
    return (
      <div className="p-10 flex items-center justify-center border rounded-md bg-gray-50 h-[400px]">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Delivery Locations Available</h3>
          <p className="text-muted-foreground">Delivery addresses need coordinates to be displayed on the map.</p>
          <p className="text-sm text-gray-400 mt-2">
            Found {deliveries.length} deliveries, but none have valid coordinate data.
          </p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Debug Information (Click to expand)
            </summary>
            <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <p><strong>Total Deliveries:</strong> {deliveries.length}</p>
              <p><strong>With Coordinates:</strong> {deliveriesWithCoords.length}</p>
              {deliveries.length > 0 && (
                <div className="mt-2">
                  <p><strong>Sample Delivery Structure:</strong></p>
                  <pre className="text-xs overflow-auto max-h-20">
                    {JSON.stringify(deliveries[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700">Map Legend:</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
          <span className="text-xs text-gray-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
          <span className="text-xs text-gray-600">In Transit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
          <span className="text-xs text-gray-600">Delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
          <span className="text-xs text-gray-600">Failed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow"></div>
          <span className="text-xs text-gray-600">Cancelled</span>
        </div>
      </div>

      {/* Delivery Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {['Scheduled', 'In Transit', 'Delivered', 'Failed', 'Cancelled'].map(status => {
          const count = deliveriesWithCoords.filter(d => 
            d.status?.toLowerCase() === status.toLowerCase() || 
            (status === 'In Transit' && d.status?.toLowerCase() === 'in transit')
          ).length;
          
          return (
            <div key={status} className="text-center p-2 bg-white rounded-lg border">
              <div className="text-lg font-bold text-gray-800">{count}</div>
              <div className="text-xs text-gray-600">{status}</div>
            </div>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="h-[400px] w-full rounded-md overflow-hidden border">
        <LeafletMap
          key={mapKey}
          mapCenter={mapCenter}
          deliveriesWithCoords={deliveriesWithCoords}
          getMarkerIcon={getMarkerIcon}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          onDeliveryClick={onDeliveryClick}
        />
      </div>
    </div>
  );
};

export default DeliveryMap;