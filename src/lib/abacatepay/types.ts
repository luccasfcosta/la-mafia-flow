// AbacatePay API Types

export interface AbacatePayConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CreateBillingRequest {
  frequency: "ONE_TIME" | "MONTHLY" | "WEEKLY" | "YEARLY";
  methods: ("PIX" | "BOLETO" | "CREDIT_CARD")[];
  products: {
    externalId: string;
    name: string;
    description?: string;
    quantity: number;
    price: number; // in cents
  }[];
  returnUrl?: string;
  completionUrl?: string;
  customerId?: string;
  customer?: {
    name: string;
    email?: string;
    cellphone?: string;
    taxId?: string; // CPF/CNPJ
  };
  metadata?: Record<string, string>;
}

export interface CreateBillingResponse {
  id: string;
  url: string;
  status: BillingStatus;
  devMode: boolean;
  methods: string[];
  products: {
    id: string;
    externalId: string;
    quantity: number;
  }[];
  frequency: string;
  amount: number;
  pix?: {
    qrCodeImage: string;
    brCode: string;
    expiresAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type BillingStatus =
  | "PENDING"
  | "EXPIRED"
  | "CANCELLED"
  | "PAID"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface GetBillingResponse extends CreateBillingResponse {
  paidAt?: string;
  paidAmount?: number;
}

// Webhook Event Types
export interface WebhookEvent {
  event: WebhookEventType;
  data: WebhookBillingData;
}

export type WebhookEventType =
  | "billing.paid"
  | "billing.expired"
  | "billing.cancelled"
  | "billing.refunded"
  | "subscription.created"
  | "subscription.cancelled"
  | "subscription.payment_failed";

export interface WebhookBillingData {
  id: string;
  status: BillingStatus;
  amount: number;
  paidAmount?: number;
  paidAt?: string;
  metadata?: Record<string, string>;
  customer?: {
    id: string;
    name: string;
    email?: string;
    cellphone?: string;
  };
}

// Subscription Types
export interface CreateSubscriptionRequest {
  frequency: "MONTHLY" | "WEEKLY" | "YEARLY";
  methods: ("PIX" | "BOLETO" | "CREDIT_CARD")[];
  products: {
    externalId: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
  }[];
  customer: {
    name: string;
    email?: string;
    cellphone?: string;
    taxId?: string;
  };
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionResponse {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  frequency: string;
  nextBillingDate: string;
  createdAt: string;
}

