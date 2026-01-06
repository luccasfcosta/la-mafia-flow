import type {
  AbacatePayConfig,
  CreateBillingRequest,
  CreateBillingResponse,
  GetBillingResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
} from "./types";

const DEFAULT_BASE_URL = "https://api.abacatepay.com/v1";

export class AbacatePayClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AbacatePayConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AbacatePay API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a new billing (one-time or recurring)
   */
  async createBilling(
    data: CreateBillingRequest
  ): Promise<CreateBillingResponse> {
    return this.request<CreateBillingResponse>("/billing/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get billing by ID
   */
  async getBilling(billingId: string): Promise<GetBillingResponse> {
    return this.request<GetBillingResponse>(`/billing/${billingId}`);
  }

  /**
   * Cancel a billing
   */
  async cancelBilling(billingId: string): Promise<void> {
    await this.request(`/billing/${billingId}/cancel`, {
      method: "POST",
    });
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> {
    return this.request<CreateSubscriptionResponse>("/subscription/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request(`/subscription/${subscriptionId}/cancel`, {
      method: "POST",
    });
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    await this.request(`/subscription/${subscriptionId}/pause`, {
      method: "POST",
    });
  }

  /**
   * Resume a subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.request(`/subscription/${subscriptionId}/resume`, {
      method: "POST",
    });
  }
}

// Singleton instance
let clientInstance: AbacatePayClient | null = null;

export function getAbacatePayClient(): AbacatePayClient {
  if (!clientInstance) {
    const apiKey = process.env.ABACATEPAY_API_KEY;

    if (!apiKey) {
      throw new Error("ABACATEPAY_API_KEY environment variable is not set");
    }

    clientInstance = new AbacatePayClient({ apiKey });
  }

  return clientInstance;
}

