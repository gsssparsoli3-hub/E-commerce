// Shared client-side types matching API responses.

export type Role = "CUSTOMER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatar: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: string;
  sortOrder: number;
  productCount?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  sku: string;
  stock: number;
  images: string[];
  tags: string[];
  status: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: string;
  category: Pick<Category, "id" | "name" | "slug">;
};

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

export type OrderItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  productId: string;
};

export type OrderEvent = {
  id: string;
  type: string; // STATUS | PAYMENT | TRACKING | NOTE
  value: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  address: Address | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string | null;
  status: string;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events?: OrderEvent[];
};

export type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  status: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  ctaText: string;
  position: string;
  status: string;
  sortOrder: number;
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  announcement: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  supportEmail: string;
  supportPhone: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  shippingFee: number;
  freeShippingAbove: number;
  wishlistEnabled: boolean;
  reviewsEnabled: boolean;
  couponsEnabled: boolean;
  maintenanceMode: boolean;
  adminUrl: string | null;
  storeUrl: string | null;
  social: Record<string, string>;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

export type AdminStats = {
  revenue: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
  pendingOrders: number;
  lowStockCount: number;
  salesSeries: { date: string; total: number; orders: number }[];
  statusBreakdown: { status: string; count: number }[];
  recentOrders: Order[];
  topProducts: { name: string; sold: number; revenue: number }[];
  lowStock: { id: string; name: string; stock: number; sku: string }[];
};
