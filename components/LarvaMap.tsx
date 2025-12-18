
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LarvaRecord } from '../types';
import { MapPin } from 'lucide-react';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const PositiveIcon = L.divIcon({
  html: `<div class="bg-rose-500 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
          <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Props {
  records: LarvaRecord[];
}

interface GeocodedRecord extends LarvaRecord {
  lat: number;
  lng: number;
}

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, 14);
  return null;
};

// Gerenciador de Cache Local para evitar requisições repetidas
const getGeoCache = () => JSON.parse(localStorage.getItem('larvascan_geocache') || '{}');
const setGeoCache = (key: string, data: { lat: number, lng: number }) => {
  const cache = getGeoCache();
  cache[key] = data;
  localStorage.setItem('larvascan_geocache', JSON.stringify(cache));
};

export const LarvaMap: React.FC<Props> = ({ records }) => {
  const [geocodedPoints, setGeocodedPoints] = useState<GeocodedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-19.5833, -42.6444]);
  const processingRef = useRef(false);

  useEffect(() => {
    const geocodeAddresses = async () => {
      if (processingRef.current) return;
      
      const positiveRecords = records.filter(r => r.isPositive).slice(0, 50);
      if (positiveRecords.length === 0) {
        setGeocodedPoints([]);
        return;
      }

      setLoading(true);
      processingRef.current = true;
      const points: GeocodedRecord[] = [];
      const cache = getGeoCache();

      for (const record of positiveRecords) {
        const queryKey = `${record.Endereco}, ${record.Numero}, ${record.Bairro}, Timoteo`.toLowerCase();
        
        if (cache[queryKey]) {
          points.push({ ...record, ...cache[queryKey] });
          continue;
        }

        try {
          // Delay para respeitar rate limit da API gratuita
          await new Promise(r => setTimeout(r, 400)); 
          const query = `${record.Endereco}, ${record.Numero}, ${record.Bairro}, Timóteo, MG, Brasil`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await response.json();

          if (data && data.length > 0) {
            const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            points.push({ ...record, ...coords });
            setGeoCache(queryKey, coords);
          }
        } catch (error) {
          console.error("Erro na geocodificação:", error);
        }
      }

      setGeocodedPoints(points);
      if (points.length > 0) {
        setMapCenter([points[0].lat, points[0].lng]);
      }
      setLoading(false);
      processingRef.current = false;
    };

    geocodeAddresses();
  }, [records]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 h-[550px] flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rose-600" />
          Mapa de Focos Ativos - Timóteo
        </h3>
        {loading && (
          <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Sincronizando coordenadas...
          </div>
        )}
      </div>
      
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={mapCenter} />
          {geocodedPoints.map((point, idx) => (
            <Marker key={idx} position={[point.lat, point.lng]} icon={PositiveIcon}>
              <Popup>
                <div className="p-1 font-sans">
                  <h4 className="font-black text-slate-900 border-b pb-1 mb-2 text-sm uppercase">Foco Confirmado</h4>
                  <p className="text-[11px] font-bold text-slate-600">{point.Endereco}, {point.Numero}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1">{point.Bairro}</p>
                  <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase">Depósito</div>
                    <div className="text-[10px] font-black text-slate-700">{point.Deposito}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
