import { apiClient } from './client';

export interface PremiumIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  publishable_key: string;
}

export const paymentsApi = {
  /**
   * Create a Stripe PaymentIntent for the premium upgrade. `amount` is in the
   * smallest currency unit (e.g. pence for GBP). Returns the client secret the
   * Stripe PaymentSheet needs.
   */
  async createPremiumIntent(
    amount: number,
    currency: string,
    plan: string,
  ): Promise<PremiumIntentResponse> {
    return apiClient.post<PremiumIntentResponse>('/payments/premium/create-intent/', {
      amount,
      currency,
      plan,
    });
  },

  /**
   * Verify the completed payment server-side and flip the account to premium.
   */
  async confirmPremium(paymentIntentId: string): Promise<{ is_premium: boolean }> {
    return apiClient.post<{ is_premium: boolean }>('/payments/premium/confirm/', {
      payment_intent_id: paymentIntentId,
    });
  },

  /** Demo / presentation: activate premium without a real Stripe call. */
  async activatePremium(): Promise<{ is_premium: boolean }> {
    return apiClient.post<{ is_premium: boolean }>('/payments/premium/activate/', {});
  },
};
