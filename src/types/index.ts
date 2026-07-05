export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  isActive: boolean;
  provider?: {
    id: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    isOnline?: boolean;
    workingHoursStart?: string;
    workingHoursEnd?: string;
    businessName?: string;
    serviceCategory?: string;
    ratingCache?: number;
    totalJobs?: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface ProviderProfile extends User {
  businessName: string;
  serviceCategory: string;
  ratingCache: number;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Service {
  id: number;
  category: string;
  name: string;
  description: string;
  basePrice: number;
  priceType: 'FIXED' | 'HOURLY' | 'STARTING_AT';
  whatIncluded?: string;
  whatExcluded?: string;
}

export interface Booking {
  id: number;
  userId: number;
  providerId?: number;
  serviceId: number;
  status: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  amountNpr: number;
  coinsUsed: number;
  scheduledAt: string;
  addressId?: number;
  address?: string;
  notes?: string;
  serviceName?: string;
  startOtp?: string;
  baseAmount?: number;
  platformFee?: number;
  totalBill?: number;
  providerEarnings?: number;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    profilePhoto?: string;
  };
  user?: {
    id: number;
    name: string;
    phone?: string;
    profilePhoto?: string;
  };
  provider?: {
    id: number;
    name: string;
    phone?: string;
    profilePhoto?: string;
    profilePhotoUrl?: string;
    businessName?: string;
    rating?: number;
    ratingCache?: number;
    totalJobs?: number;
  };
}
