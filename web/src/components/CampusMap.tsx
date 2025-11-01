import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

interface IssueMarker {
  id: string;
  lat: number;
  lng: number;
  reported?: boolean;
}

interface CampusMapProps {
  issues?: IssueMarker[];
  onMarkerClick?: (issueId: string) => void;
}

// Fix default Leaflet icon path
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const reportedIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function CampusMap({ issues = [], onMarkerClick }: CampusMapProps) {
  // Default to Vienna/WU campus area
  const defaultCenter: [number, number] = [48.2132, 16.3599];
  const defaultZoom = 16;

  // Set default icon
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).L) {
      (window as any).L.Marker.prototype.options.icon = defaultIcon;
    }
  }, []);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-300" style={{ minHeight: "300px" }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={issue.reported ? reportedIcon : defaultIcon}
            eventHandlers={{
              click: () => onMarkerClick?.(issue.id),
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">{issue.id}</p>
                {issue.reported && <p className="text-green-600 text-sm">✓ Reported</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

