export type VehicleCategory =
  | 'ATV_UTV'
  | 'SNOWMOBILE'
  | 'WATERCRAFT'
  | 'MOTORCYCLE'
  | 'TRAILER';

export interface BrandDefinition {
  id: string;
  name: string;
  categories: VehicleCategory[];
  popular?: boolean;
}

export const POWERSPORTS_BRANDS: BrandDefinition[] = [
  { id: 'can-am', name: 'Can-Am (BRP)', categories: ['ATV_UTV'], popular: true },
  { id: 'polaris', name: 'Polaris', categories: ['ATV_UTV', 'SNOWMOBILE'], popular: true },
  { id: 'ski-doo', name: 'Ski-Doo (BRP)', categories: ['SNOWMOBILE'], popular: true },
  { id: 'sea-doo', name: 'Sea-Doo (BRP)', categories: ['WATERCRAFT'], popular: true },
  { id: 'yamaha', name: 'Yamaha', categories: ['ATV_UTV', 'SNOWMOBILE', 'WATERCRAFT', 'MOTORCYCLE'], popular: true },
  { id: 'honda', name: 'Honda', categories: ['ATV_UTV', 'MOTORCYCLE'], popular: true },
  { id: 'kawasaki', name: 'Kawasaki', categories: ['ATV_UTV', 'WATERCRAFT', 'MOTORCYCLE'], popular: true },
  { id: 'suzuki', name: 'Suzuki', categories: ['ATV_UTV', 'MOTORCYCLE'], popular: true },

  { id: 'arctic-cat', name: 'Arctic Cat', categories: ['ATV_UTV', 'SNOWMOBILE'], popular: true },
  { id: 'cfmoto', name: 'CFMOTO', categories: ['ATV_UTV', 'MOTORCYCLE'], popular: true },
  { id: 'segway', name: 'Segway Powersports', categories: ['ATV_UTV'] },
  { id: 'textron', name: 'Textron Off Road', categories: ['ATV_UTV'] },
  { id: 'kymco', name: 'KYMCO', categories: ['ATV_UTV', 'MOTORCYCLE'] },
  { id: 'hisun', name: 'Hisun Motors', categories: ['ATV_UTV'] },
  { id: 'tgb', name: 'TGB (Taiwan Golden Bee)', categories: ['ATV_UTV'] },
  { id: 'argo', name: 'Argo', categories: ['ATV_UTV'] },
  { id: 'odes', name: 'Odes Industry / AODES', categories: ['ATV_UTV'] },
  { id: 'linhai', name: 'Linhai', categories: ['ATV_UTV'] },
  { id: 'tracker-off-road', name: 'Tracker Off Road', categories: ['ATV_UTV'] },
  { id: 'cub-cadet', name: 'Cub Cadet (Utility)', categories: ['ATV_UTV'] },
  { id: 'john-deere-gator', name: 'John Deere (Gator)', categories: ['ATV_UTV'] },
  { id: 'kubota', name: 'Kubota (RTV)', categories: ['ATV_UTV'] },
  { id: 'mahindra-roxor', name: 'Mahindra Roxor', categories: ['ATV_UTV'] },

  { id: 'lynx', name: 'Lynx (BRP)', categories: ['SNOWMOBILE'], popular: true },
  { id: 'taiga', name: 'Taiga Motors (Électrique)', categories: ['SNOWMOBILE', 'WATERCRAFT'] },

  { id: 'krash', name: 'Krash Industries', categories: ['WATERCRAFT'] },
  { id: 'kawasaki-jet-ski', name: 'Kawasaki Jet Ski', categories: ['WATERCRAFT'], popular: true },
  { id: 'princecraft', name: 'Princecraft', categories: ['WATERCRAFT'], popular: true },
  { id: 'crestliner', name: 'Crestliner', categories: ['WATERCRAFT'] },
  { id: 'legend', name: 'Legend Boats', categories: ['WATERCRAFT'], popular: true },
  { id: 'g3', name: 'G3 Boats', categories: ['WATERCRAFT'], popular: true },
  { id: 'suncatcher', name: 'SunCatcher', categories: ['WATERCRAFT'] },

  { id: 'ktm', name: 'KTM', categories: ['MOTORCYCLE'], popular: true },
  { id: 'husqvarna', name: 'Husqvarna', categories: ['MOTORCYCLE'], popular: true },
  { id: 'gasgas', name: 'GASGAS', categories: ['MOTORCYCLE'] },
  { id: 'beta', name: 'Beta Motorcycles', categories: ['MOTORCYCLE'] },
  { id: 'sherco', name: 'Sherco', categories: ['MOTORCYCLE'] },
  { id: 'bmw-motorrad', name: 'BMW Motorrad', categories: ['MOTORCYCLE'], popular: true },
  { id: 'triumph', name: 'Triumph', categories: ['MOTORCYCLE'] },
  { id: 'ducati', name: 'Ducati', categories: ['MOTORCYCLE'] },
  { id: 'harley-davidson', name: 'Harley-Davidson', categories: ['MOTORCYCLE'], popular: true },
  { id: 'indian', name: 'Indian Motorcycle', categories: ['MOTORCYCLE'] },
  { id: 'royal-enfield', name: 'Royal Enfield', categories: ['MOTORCYCLE'] },
  { id: 'aprilia', name: 'Aprilia', categories: ['MOTORCYCLE'] },
  { id: 'moto-guzzi', name: 'Moto Guzzi', categories: ['MOTORCYCLE'] },
  { id: 'zero-motorcycles', name: 'Zero Motorcycles (Électrique)', categories: ['MOTORCYCLE'] },
  { id: 'sur-ron', name: 'Sur-Ron / Talaria', categories: ['MOTORCYCLE'] },

  { id: 'n-n-trailers', name: 'N&N Trailers', categories: ['TRAILER'] },
  { id: 'maxi-roule', name: 'Maxi-Roule', categories: ['TRAILER'] },
  { id: 'gator-trailers', name: 'Gator Trailers', categories: ['TRAILER'] },
  { id: 'k-trail', name: 'K-Trail', categories: ['TRAILER'] },
  { id: 'mission-trailers', name: 'Mission Trailers', categories: ['TRAILER'] },
  { id: 'ez-loader', name: 'EZ Loader', categories: ['TRAILER'] },
  { id: 'triton-trailers', name: 'Triton Trailers', categories: ['TRAILER'] },

  { id: 'autre', name: 'Autre marque...', categories: ['ATV_UTV', 'SNOWMOBILE', 'WATERCRAFT', 'MOTORCYCLE', 'TRAILER'] },
];

export function getBrandsByCategory(category?: VehicleCategory): BrandDefinition[] {
  const brands = category
    ? POWERSPORTS_BRANDS.filter((brand) => brand.categories.includes(category))
    : POWERSPORTS_BRANDS;

  return [...brands].sort((a, b) => {
    if (a.id === 'autre') return 1;
    if (b.id === 'autre') return -1;
    if (!!a.popular !== !!b.popular) return a.popular ? -1 : 1;
    return a.name.localeCompare(b.name, 'fr-CA');
  });
}
