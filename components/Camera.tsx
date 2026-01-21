import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CameraOff, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CameraProps {
  onCapture: (imageData: string, location: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [address, setAddress] = useState<string>('Buscando endereço...');

  useEffect(() => {
    // 1. Get Location & Reverse Geocode
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Fetch readable address from OpenStreetMap (Nominatim)
            // Note: In a high-traffic production app, you should use your own API Key/Service (e.g., Google Maps Geocoding)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            
            if (data && data.address) {
                const road = data.address.road || data.address.street || data.address.pedestrian || '';
                const number = data.address.house_number || '';
                const suburb = data.address.suburb || data.address.neighbourhood || '';
                const city = data.address.city || data.address.town || data.address.municipality || '';
                
                // Construct address: "Rua X, 123 - Bairro"
                let formatted = [road, number].filter(Boolean).join(', ');
                if (suburb) formatted += ` - ${suburb}`;
                if (city) formatted += ` - ${city}`;

                setAddress(formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            } else {
                 setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          } catch (err) {
            console.error("Erro ao buscar endereço:", err);
            // Fallback to coordinates if fetch fails
            setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        },
        (err) => {
          console.error(err);
          setAddress("Localização não disponível");
        }
      );
    } else {
      setAddress("Geolocalização não suportada");
    }

    // 2. Start Camera
    startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add Overlay (Semi-transparent black bar at bottom)
    const barHeight = 80;
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    // Add Text Data
    context.fillStyle = '#fbbf24'; // Yellow-400
    context.font = 'bold 24px Arial';
    
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
    
    context.fillText(timestamp, 20, canvas.height - 45);
    
    context.fillStyle = '#ffffff';
    context.font = '16px Arial';
    // Use the fetched address string here
    context.fillText(address, 20, canvas.height - 15);

    // Convert to Base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop stream and return data
    stopCamera();
    onCapture(imageData, address);
  }, [stream, address, onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-64 bg-zinc-900 rounded-lg border border-zinc-700">
        <CameraOff className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400">{error}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded font-bold uppercase">Fechar</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute w-full h-full object-cover"
        />
        
        {/* Helper Frame Overlay */}
        <div className="absolute border-2 border-yellow-400/50 rounded-lg w-3/4 h-1/3 pointer-events-none flex items-center justify-center">
          <p className="text-yellow-400/80 text-sm font-bold bg-black/60 px-2 rounded uppercase font-mono">Enquadre o odômetro</p>
        </div>

        {/* Live Data Overlay Preview */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent text-white">
          <div className="flex items-start gap-2 mb-1">
            <MapPin className="w-4 h-4 text-yellow-400 mt-1 shrink-0" />
            <span className="text-sm font-mono leading-tight">{address}</span>
          </div>
          <div className="text-xs text-zinc-400 font-mono ml-6">
            {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
          </div>
        </div>
      </div>

      <div className="h-24 bg-zinc-900 flex items-center justify-around px-6 border-t border-zinc-800">
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-4 uppercase font-bold text-sm font-mono">
          Cancelar
        </button>
        <button 
          onClick={handleCapture}
          className="w-16 h-16 bg-white rounded-full border-4 border-zinc-700 flex items-center justify-center active:scale-95 transition-transform hover:border-yellow-400"
        >
          <div className="w-14 h-14 bg-white rounded-full border-2 border-black"></div>
        </button>
        <button onClick={() => startCamera()} className="text-zinc-400 hover:text-white p-4">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>
      
      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};