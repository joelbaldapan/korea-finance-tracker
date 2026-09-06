import type { IGeocodingService, GeocodeResult } from '../interfaces/index.js';

export class KakaoGeocodingService implements IGeocodingService {
  constructor(private apiKey: string) {}

  async geocode(keyword: string, deviceLat?: number, deviceLng?: number): Promise<GeocodeResult | null> {
    // SEOULTECH FALLBACK
    const x = deviceLng ?? 127.077582;
    const y = deviceLat ?? 37.631825;
    
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.append('query', keyword);
    url.searchParams.append('x', x.toString());
    url.searchParams.append('y', y.toString());
    url.searchParams.append('radius', '20000'); // 20km search radius
    url.searchParams.append('sort', 'distance');
    
    const res = await fetch(url.toString(), {
        headers: { 'Authorization': `KakaoAK ${this.apiKey}` }
    });
    
    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Kakao API Error ${res.status}: ${errorBody}`);
    }
    const data = await res.json();
    
    if (data.documents && data.documents.length > 0) {
        const top = data.documents[0];
        return {
            lat: parseFloat(top.y),
            lng: parseFloat(top.x),
            address: top.road_address_name || top.address_name
        };
    }
    return null;
  }
}
