import { paymentMethodRepository } from '../repositories/payment-method.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { paymentHistoryRepository } from '../repositories/payment-history.repository';
// import { tokenUsageRepository } from '../repositories/token-usage.repository'; // TODO: implement when needed
import { univapayService, TokenParams, ChargeParams } from './univapay.service';
import { logger } from '../../../common/utils/logger';
import { 
  ID, 
  TokenPackage,
  PaymentMethodType,
  InvoiceItem,
  InvoiceStatus
} from '../../../types/index';
import { IPaymentMethod } from '../models/payment-method.model';
import { IInvoice } from '../models/invoice.model';

export interface CreatePaymentMethodParams {
  organizationId: ID;
  cardDetails: {
    cardholder: string;
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvv: string;
  };
  email: string;
  isDefault?: boolean;
}

export interface TokenChargeParams {
  organizationId: ID;
  tokenPackage: TokenPackage;
  paymentMethodId?: ID;
}

export interface BillingSummaryData {
  totalRevenue: number;
  subscriptionRevenue: number;
  tokenRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  pendingInvoices: number;
  successfulPayments: number;
  failedPayments: number;
}

export class BillingService {
  private readonly tokenPackages = {
    [TokenPackage.STANDARD]: {
      name: 'スタンダードパック',
      tokenAmount: 1000000,
      price: 980,
      description: '100万トークン'
    },
    [TokenPackage.PREMIUM]: {
      name: 'プレミアムパック', 
      tokenAmount: 10000000,
      price: 8000,
      description: '1000万トークン',
      savingsPercentage: 18
    }
  };

  async createPaymentMethod(params: CreatePaymentMethodParams): Promise<IPaymentMethod> {
    try {
      logger.info('Creating payment method', { 
        organizationId: params.organizationId,
        cardholder: params.cardDetails.cardholder 
      });

      const tokenParams: TokenParams = {
        payment_type: 'card',
        type: 'recurring',
        email: params.email,
        data: {
          cardholder: params.cardDetails.cardholder,
          card_number: params.cardDetails.cardNumber,
          exp_month: params.cardDetails.expMonth,
          exp_year: params.cardDetails.expYear,
          cvv: params.cardDetails.cvv,
          three_ds: {
            enabled: true
          }
        }
      };

      const univapayToken = await univapayService.createTransactionToken(tokenParams);

      const paymentMethodData = {
        organizationId: params.organizationId,
        type: 'credit_card' as PaymentMethodType,
        last4: params.cardDetails.cardNumber.slice(-4),
        expiryMonth: parseInt(params.cardDetails.expMonth),
        expiryYear: parseInt(params.cardDetails.expYear),
        brand: this.detectCardBrand(params.cardDetails.cardNumber),
        isDefault: params.isDefault || false,
        univapayTokenId: univapayToken.id,
        metadata: {
          cardholder: params.cardDetails.cardholder
        }
      };

      const paymentMethod = await paymentMethodRepository.create(paymentMethodData);

      logger.info('Payment method created successfully', { 
        paymentMethodId: paymentMethod._id,
        organizationId: params.organizationId,
        last4: paymentMethod.last4
      });

      return paymentMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create payment method', { 
        error: errorMessage,
        organizationId: params.organizationId 
      });
      throw error;
    }
  }

  async chargeTokens(params: TokenChargeParams): Promise<{ invoice: IInvoice; charge: any }> {
    try {
      logger.info('Processing token charge', { 
        organizationId: params.organizationId,
        tokenPackage: params.tokenPackage 
      });

      const tokenPackage = this.tokenPackages[params.tokenPackage];
      if (!tokenPackage) {
        throw new Error('指定されたトークンパッケージが見つかりません');
      }

      let paymentMethod: IPaymentMethod | null;
      if (params.paymentMethodId) {
        paymentMethod = await paymentMethodRepository.findById(params.paymentMethodId);
        if (!paymentMethod || paymentMethod.organizationId.toString() !== params.organizationId.toString()) {
          throw new Error('指定された支払い方法が見つかりません');
        }
      } else {
        paymentMethod = await paymentMethodRepository.findDefaultByOrganizationId(params.organizationId);
        if (!paymentMethod) {
          throw new Error('デフォルトの支払い方法が設定されていません');
        }
      }

      const items: InvoiceItem[] = [{
        description: `${tokenPackage.name}（${tokenPackage.description}）`,
        unitPrice: tokenPackage.price,
        quantity: 1,
        amount: tokenPackage.price
      }];

      const invoice = await invoiceRepository.create({
        organizationId: params.organizationId,
        issueDate: new Date(),
        dueDate: new Date(), // 即時支払い
        status: InvoiceStatus.SENT,
        items,
        subtotal: tokenPackage.price,
        tax: 0,
        total: tokenPackage.price,
        type: 'token',
        paymentMethodId: paymentMethod._id,
        metadata: {
          tokenPackage: params.tokenPackage,
          tokenAmount: tokenPackage.tokenAmount
        }
      });

      const charge = await this.processImmediatePayment(invoice, paymentMethod);

      logger.info('Token charge processed successfully', { 
        invoiceId: invoice._id,
        chargeId: charge.id,
        amount: tokenPackage.price,
        tokenAmount: tokenPackage.tokenAmount
      });

      return { invoice, charge };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process token charge', { 
        error: errorMessage,
        organizationId: params.organizationId,
        tokenPackage: params.tokenPackage
      });
      throw error;
    }
  }

  async getBillingSummary(organizationId: ID): Promise<BillingSummaryData> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const [
        totalRevenue,
        subscriptionRevenue,
        tokenRevenue,
        outstandingAmount,
        overdueInvoices,
        pendingInvoices,
        successfulPayments,
        failedPayments
      ] = await Promise.all([
        invoiceRepository.getTotalAmountByOrganization(organizationId, InvoiceStatus.PAID),
        invoiceRepository.getTotalAmountByOrganization(organizationId, InvoiceStatus.PAID),
        this.getTokenRevenueByOrganization(organizationId),
        invoiceRepository.getTotalAmountByOrganization(organizationId, InvoiceStatus.SENT),
        invoiceRepository.findOverdue(),
        invoiceRepository.findPendingByOrganization(organizationId),
        paymentHistoryRepository.getSuccessfulPaymentsByOrganization(organizationId, startOfMonth, endOfMonth),
        paymentHistoryRepository.getFailedPaymentsByOrganization(organizationId, startOfMonth, endOfMonth)
      ]);

      const overdueAmount = overdueInvoices
        .filter(invoice => invoice.organizationId.toString() === organizationId.toString())
        .reduce((sum, invoice) => sum + invoice.total, 0);

      return {
        totalRevenue,
        subscriptionRevenue: subscriptionRevenue * 0.8, // 仮の計算
        tokenRevenue: tokenRevenue,
        outstandingAmount,
        overdueAmount,
        pendingInvoices: pendingInvoices.length,
        successfulPayments: successfulPayments.count,
        failedPayments: failedPayments.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get billing summary', { error: errorMessage, organizationId });
      throw error;
    }
  }

  async getInvoicesByOrganization(organizationId: ID, limit?: number): Promise<IInvoice[]> {
    try {
      return await invoiceRepository.findByOrganizationId(organizationId, limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get invoices by organization', { error: errorMessage, organizationId });
      throw error;
    }
  }

  async getPaymentMethods(organizationId: ID): Promise<IPaymentMethod[]> {
    try {
      return await paymentMethodRepository.findByOrganizationId(organizationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get payment methods', { error: errorMessage, organizationId });
      throw error;
    }
  }

  async processWebhook(payload: any, signature: string): Promise<void> {
    try {
      logger.info('Processing webhook', { eventType: payload.type });

      if (!univapayService.verifyWebhookSignature(payload, signature)) {
        throw new Error('Webhook signature verification failed');
      }

      switch (payload.type) {
        case 'charge.succeeded':
          await this.handleChargeSucceeded(payload.data);
          break;
        case 'charge.failed':
          await this.handleChargeFailed(payload.data);
          break;
        case 'subscription.invoice.payment_succeeded':
          await this.handleSubscriptionPaymentSucceeded(payload.data);
          break;
        case 'subscription.invoice.payment_failed':
          await this.handleSubscriptionPaymentFailed(payload.data);
          break;
        default:
          logger.info('Unhandled webhook event type', { eventType: payload.type });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process webhook', { error: errorMessage, payload });
      throw error;
    }
  }

  async getTokenPackageDetails(tokenPackage: TokenPackage) {
    const packageDetails = this.tokenPackages[tokenPackage];
    if (!packageDetails) {
      throw new Error('指定されたトークンパッケージが見つかりません');
    }
    return packageDetails;
  }

  private async processImmediatePayment(invoice: IInvoice, paymentMethod: IPaymentMethod): Promise<any> {
    if (!paymentMethod.univapayTokenId) {
      throw new Error('支払い方法にUnivapayトークンが設定されていません');
    }

    const chargeParams: ChargeParams = {
      amount: invoice.total,
      currency: 'JPY',
      capture: true,
      descriptor: `Salomoni Token Charge`,
      metadata: {
        invoiceId: invoice._id.toString(),
        organizationId: invoice.organizationId.toString()
      }
    };

    const charge = await univapayService.createCharge(paymentMethod.univapayTokenId, chargeParams);

    await invoiceRepository.update(invoice._id, {
      status: charge.status === 'completed' ? 'paid' : 'sent',
      paidAt: charge.status === 'completed' ? new Date() : undefined,
      univapayChargeId: charge.id
    });

    await paymentHistoryRepository.create({
      organizationId: invoice.organizationId,
      invoiceId: invoice._id,
      amount: invoice.total,
      paymentMethodId: paymentMethod._id,
      status: charge.status === 'completed' ? 'success' : 'pending',
      univapayChargeId: charge.id,
      univapayTransactionId: charge.transaction_id
    });

    return charge;
  }

  private async getTokenRevenueByOrganization(organizationId: ID): Promise<number> {
    const tokenInvoices = await invoiceRepository.findAll({
      organizationId,
      type: 'token',
      status: 'paid'
    });

    return tokenInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }

  private async handleChargeSucceeded(chargeData: any): Promise<void> {
    const invoice = await invoiceRepository.findByUnivapayChargeId(chargeData.id);
    if (invoice) {
      await invoiceRepository.updateStatus(invoice._id, InvoiceStatus.PAID, new Date());
      
      const paymentHistory = await paymentHistoryRepository.findByUnivapayChargeId(chargeData.id);
      if (paymentHistory) {
        await paymentHistoryRepository.update(paymentHistory._id, { status: 'success' });
      }
    }
  }

  private async handleChargeFailed(chargeData: any): Promise<void> {
    const invoice = await invoiceRepository.findByUnivapayChargeId(chargeData.id);
    if (invoice) {
      const paymentHistory = await paymentHistoryRepository.findByUnivapayChargeId(chargeData.id);
      if (paymentHistory) {
        await paymentHistoryRepository.update(paymentHistory._id, { 
          status: 'failed',
          failureReason: chargeData.failure_reason || 'Unknown error'
        });
      }
    }
  }

  private async handleSubscriptionPaymentSucceeded(subscriptionData: any): Promise<void> {
    logger.info('Subscription payment succeeded', { subscriptionId: subscriptionData.id });
  }

  private async handleSubscriptionPaymentFailed(subscriptionData: any): Promise<void> {
    logger.info('Subscription payment failed', { subscriptionId: subscriptionData.id });
  }

  private detectCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^35/.test(cleanNumber)) return 'jcb';
    if (/^30[0-5]/.test(cleanNumber)) return 'diners';
    
    return 'unknown';
  }
}

export const billingService = new BillingService();