import { Subscription, Payment, Invoice } from "@talent/types";

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  session: {
    id: string;
    url: string;
  };
}

export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd?: boolean;
}

export interface UpdatePaymentMethodRequest {
  paymentMethodId: string;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class StripeApi {
  private baseUrl = "http://localhost:3001/stripe";
  private getAuthHeaders = () => {
    // This will be called on the client side where we have access to localStorage or session
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const authHeaders = this.getAuthHeaders();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (authHeaders.Authorization) {
      headers.Authorization = authHeaders.Authorization;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  }

  async createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    return this.request("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createCheckoutSession(
    data: CreateCheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    return this.request("/create-checkout-session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelSubscription(
    data: CancelSubscriptionRequest = {}
  ): Promise<SubscriptionResponse> {
    return this.request("/subscriptions/cancel", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePaymentMethod(
    data: UpdatePaymentMethodRequest
  ): Promise<ApiResponse<void>> {
    return this.request("/payment-methods", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSubscription(): Promise<SubscriptionResponse> {
    return this.request("/subscriptions");
  }

  async getPaymentHistory(): Promise<PaymentsResponse> {
    return this.request("/payments");
  }

  async getInvoices(): Promise<InvoicesResponse> {
    return this.request("/invoices");
  }
}

export const stripeApi = new StripeApi();
