import { Product, Category, Brand } from '@/types/product';

export const categories: Category[] = [
  { id: '1', name: 'Switches', slug: 'switches', description: 'Premium modular switches and accessories', icon: 'ToggleRight', image: '/switches.jpg' },
  { id: '2', name: 'Wires & Cables', slug: 'wires', description: 'High-quality copper wires and cables', icon: 'Cable', image: '/wires.jpg' },
  { id: '3', name: 'MCBs & DBs', slug: 'mcbs', description: 'Circuit breakers and distribution boards', icon: 'Zap', image: '/mcbs.jpg' },
  { id: '4', name: 'Lighting', slug: 'lighting', description: 'Surface, concealed, and panel lights', icon: 'Lightbulb', image: '/lights.jpg' },
  { id: '5', name: 'Fans', slug: 'fans', description: 'Ceiling fans and exhaust fans', icon: 'Fan', image: '/fans.jpg' },
  { id: '6', name: 'Smart Home', slug: 'smart-home', description: 'Automation and smart controls', icon: 'Smartphone', image: '/smart.jpg' },
];

export const brands: Brand[] = [
  { id: '1', name: 'Lauritz Knudsen', slug: 'lauritz-knudsen', logo: '/brands/lk.svg', description: 'Premium Danish electrical solutions since 1893', featured: true, catalogUrl: '/catalogs/lk-2024.pdf' },
  { id: '2', name: 'ABB', slug: 'abb', logo: '/brands/abb.svg', description: 'Global leader in power and automation', featured: true },
  { id: '3', name: 'Havells', slug: 'havells', logo: '/brands/havells.svg', description: 'India\'s leading electrical equipment company', featured: true },
  { id: '4', name: 'Polycab', slug: 'polycab', logo: '/brands/polycab.svg', description: 'India\'s largest wires & cables manufacturer', featured: true },
  { id: '5', name: 'Crompton', slug: 'crompton', logo: '/brands/crompton.svg', description: 'Trusted electrical products since 1937', featured: true },
  { id: '6', name: 'Vion Lights', slug: 'vion', logo: '/brands/vion.svg', description: 'Premium LED lighting solutions', featured: false },
  { id: '7', name: 'Finolex', slug: 'finolex', logo: '/brands/finolex.svg', description: 'Quality wires and cables', featured: false },
  { id: '8', name: 'AO Smith', slug: 'ao-smith', logo: '/brands/aosmith.svg', description: 'Premium water heating solutions', featured: false },
];

export const products: Product[] = [
  // Lauritz Knudsen Switches
  {
    id: '1',
    sku: 'LK-CB91102LW00',
    name: 'Entice 1 Way Switch 10AX',
    brand: 'Lauritz Knudsen',
    category: 'Switches',
    series: 'Entice',
    listPrice: 249,
    currency: 'INR',
    images: ['/products/lk-switch-1.jpg'],
    description: 'Premium 1-way switch with elegant design and superior build quality',
    specs: { rating: '10AX', modules: '1', color: 'White', warranty: '10 Years' },
    badge: 'popular',
  },
  {
    id: '2',
    sku: 'LK-CB91202LW00',
    name: 'Entice 2 Way Switch 10AX',
    brand: 'Lauritz Knudsen',
    category: 'Switches',
    series: 'Entice',
    listPrice: 299,
    currency: 'INR',
    images: ['/products/lk-switch-2.jpg'],
    description: 'Premium 2-way switch for staircase and corridor lighting control',
    specs: { rating: '10AX', modules: '1', color: 'White', warranty: '10 Years' },
  },
  {
    id: '3',
    sku: 'LK-CB91502LW00',
    name: 'Entice Bell Push 10AX',
    brand: 'Lauritz Knudsen',
    category: 'Switches',
    series: 'Entice',
    listPrice: 279,
    currency: 'INR',
    images: ['/products/lk-bell.jpg'],
    description: 'Elegant bell push switch with spring return mechanism',
    specs: { rating: '10AX', modules: '1', color: 'White', warranty: '10 Years' },
    badge: 'new',
  },
  // ABB Products
  {
    id: '4',
    sku: 'ABB-SH201-C16',
    name: 'SH201 MCB 16A C-Curve',
    brand: 'ABB',
    category: 'MCBs & DBs',
    series: 'SH200',
    listPrice: 385,
    currency: 'INR',
    images: ['/products/abb-mcb-1.jpg'],
    description: 'Single pole miniature circuit breaker for residential applications',
    specs: { poles: '1P', rating: '16A', curve: 'C', breaking: '6kA', warranty: '2 Years' },
    badge: 'best-value',
  },
  {
    id: '5',
    sku: 'ABB-SH203-C32',
    name: 'SH203 MCB 32A C-Curve',
    brand: 'ABB',
    category: 'MCBs & DBs',
    series: 'SH200',
    listPrice: 1150,
    currency: 'INR',
    images: ['/products/abb-mcb-3.jpg'],
    description: 'Three pole MCB for higher load applications',
    specs: { poles: '3P', rating: '32A', curve: 'C', breaking: '6kA', warranty: '2 Years' },
  },
  // Polycab Wires
  {
    id: '6',
    sku: 'PLY-FR-1.5-R',
    name: 'FR House Wire 1.5 sq mm Red',
    brand: 'Polycab',
    category: 'Wires & Cables',
    series: 'FR House Wire',
    listPrice: 1850,
    currency: 'INR',
    images: ['/products/polycab-wire-1.jpg'],
    description: 'Flame retardant PVC insulated copper conductor wire (90m coil)',
    specs: { size: '1.5 sq mm', length: '90m', conductor: 'Copper', insulation: 'FR PVC', warranty: '25 Years' },
    badge: 'popular',
  },
  {
    id: '7',
    sku: 'PLY-FR-2.5-B',
    name: 'FR House Wire 2.5 sq mm Black',
    brand: 'Polycab',
    category: 'Wires & Cables',
    series: 'FR House Wire',
    listPrice: 2950,
    currency: 'INR',
    images: ['/products/polycab-wire-2.jpg'],
    description: 'Flame retardant PVC insulated copper conductor wire (90m coil)',
    specs: { size: '2.5 sq mm', length: '90m', conductor: 'Copper', insulation: 'FR PVC', warranty: '25 Years' },
  },
  // Havells Fans
  {
    id: '8',
    sku: 'HAV-ES50-1200',
    name: 'ES 50 Premium Ceiling Fan 1200mm',
    brand: 'Havells',
    category: 'Fans',
    series: 'ES 50',
    listPrice: 3299,
    currency: 'INR',
    images: ['/products/havells-fan-1.jpg'],
    description: 'Energy-saving 5-star rated ceiling fan with powerful air delivery',
    specs: { size: '1200mm', power: '50W', speed: '380 RPM', delivery: '230 CMM', warranty: '2 Years' },
    badge: 'best-value',
  },
  {
    id: '9',
    sku: 'HAV-FESTIVA-1200',
    name: 'Festiva Premium Ceiling Fan',
    brand: 'Havells',
    category: 'Fans',
    series: 'Festiva',
    listPrice: 4599,
    currency: 'INR',
    images: ['/products/havells-fan-2.jpg'],
    description: 'Designer ceiling fan with decorative trims and silent operation',
    specs: { size: '1200mm', power: '72W', speed: '350 RPM', delivery: '220 CMM', warranty: '2 Years' },
    badge: 'new',
  },
  // Vion Lights
  {
    id: '10',
    sku: 'VION-PNL-18W',
    name: 'LED Panel Light 18W Round',
    brand: 'Vion Lights',
    category: 'Lighting',
    series: 'Panel',
    listPrice: 599,
    currency: 'INR',
    images: ['/products/vion-panel-1.jpg'],
    description: 'Slim LED panel light with uniform light distribution',
    specs: { wattage: '18W', type: 'Round', color: '6500K', lumens: '1800', warranty: '2 Years' },
    badge: 'popular',
  },
  {
    id: '11',
    sku: 'VION-COB-12W',
    name: 'LED COB Spotlight 12W',
    brand: 'Vion Lights',
    category: 'Lighting',
    series: 'COB',
    listPrice: 799,
    currency: 'INR',
    images: ['/products/vion-cob-1.jpg'],
    description: 'Premium COB spotlight for accent lighting',
    specs: { wattage: '12W', beamAngle: '40°', color: '4000K', lumens: '1200', warranty: '2 Years' },
  },
  // Crompton Products
  {
    id: '12',
    sku: 'CRM-HS3-1200',
    name: 'HighSpeed 1200mm Ceiling Fan',
    brand: 'Crompton',
    category: 'Fans',
    series: 'HighSpeed',
    listPrice: 1999,
    currency: 'INR',
    images: ['/products/crompton-fan-1.jpg'],
    description: 'High-speed ceiling fan with powerful air thrust',
    specs: { size: '1200mm', power: '75W', speed: '400 RPM', delivery: '240 CMM', warranty: '2 Years' },
  },
];

export const getProductById = (id: string): Product | undefined => 
  products.find(p => p.id === id);

export const getProductBySku = (sku: string): Product | undefined => 
  products.find(p => p.sku === sku);

export const getProductsByCategory = (category: string): Product[] => 
  products.filter(p => p.category.toLowerCase() === category.toLowerCase());

export const getProductsByBrand = (brand: string): Product[] => 
  products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());

export const searchProducts = (query: string): Product[] => {
  const q = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.series.toLowerCase().includes(q) ||
    Object.values(p.specs).some(v => v.toLowerCase().includes(q))
  );
};

export const getFeaturedProducts = (brand?: string): Product[] => {
  const filtered = brand ? products.filter(p => p.brand === brand) : products;
  return filtered.filter(p => p.badge).slice(0, 5);
};
