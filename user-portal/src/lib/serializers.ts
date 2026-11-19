import type { Prisma } from "@prisma/client";

// Central serializers keep API responses consistent and files small.

export function serializeProduct<T extends { category: { id: string; name: string; slug: string }; images: string; tags: string }>(
  product: T & { createdAt: Date }
) {
  return {
    ...product,
    images: safeParse(product.images, [] as string[]),
    tags: safeParse(product.tags, [] as string[]),
    createdAt: product.createdAt.toISOString(),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
  };
}

export function serializeOrder(order: {
  id: string;
  orderNumber: string;
  addressJson: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string | null;
  status: string;
  createdAt: Date;
  items: { id: string; name: string; image: string; price: number; quantity: number; productId: string }[];
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    address: safeParse(order.addressJson, null as unknown) as Record<string, unknown> | null,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    couponCode: order.couponCode,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentId: order.paymentId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items,
  };
}

export function serializeSettings(setting: {
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
  socialJson: string;
}) {
  return {
    siteName: setting.siteName,
    tagline: setting.tagline,
    announcement: setting.announcement,
    logoUrl: setting.logoUrl,
    faviconUrl: setting.faviconUrl,
    primaryColor: setting.primaryColor,
    supportEmail: setting.supportEmail,
    supportPhone: setting.supportPhone,
    seoTitle: setting.seoTitle,
    seoDescription: setting.seoDescription,
    seoKeywords: setting.seoKeywords,
    codEnabled: setting.codEnabled,
    razorpayEnabled: setting.razorpayEnabled,
    shippingFee: setting.shippingFee,
    freeShippingAbove: setting.freeShippingAbove,
    wishlistEnabled: setting.wishlistEnabled,
    reviewsEnabled: setting.reviewsEnabled,
    couponsEnabled: setting.couponsEnabled,
    maintenanceMode: setting.maintenanceMode,
    adminUrl: setting.adminUrl,
    storeUrl: setting.storeUrl,
    social: safeParse(setting.socialJson, {} as Record<string, string>),
  };
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;
