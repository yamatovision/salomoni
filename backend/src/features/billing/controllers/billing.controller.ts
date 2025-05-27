import { Request, Response } from 'express';
import { billingService } from '../services/billing.service';
import { subscriptionService } from '../services/subscription.service';
import { RevenueSimulationService } from '../services/revenue-simulation.service';
// import { univapayService } from '../services/univapay.service'; // TODO: implement when needed
import { 
  createPaymentMethodSchema,
  createSubscriptionSchema,
  tokenChargeSchema,
  webhookSchema,
  billingQuerySchema,
  formatValidationError
} from '../validators/billing.validator';
import { logger } from '../../../common/utils/logger';
import { AuthenticatedRequest } from '../../../common/middleware/auth';
import { TokenPackage, UserRole } from '../../../types';

// APIエンドポイント 8.1: 決済トークン作成
export const createPaymentToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = createPaymentMethodSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const { organizationId, cardDetails, email, isDefault } = value;

    if (req.user?.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'この組織の決済情報を作成する権限がありません'
      });
    }

    const paymentMethod = await billingService.createPaymentMethod({
      organizationId,
      cardDetails,
      email,
      isDefault
    });

    logger.info('Payment token created successfully', {
      paymentMethodId: paymentMethod._id,
      organizationId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: {
        id: paymentMethod._id,
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        brand: paymentMethod.brand,
        isDefault: paymentMethod.isDefault,
        createdAt: paymentMethod.createdAt
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to create payment token', {
      error: errorMessage,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: errorMessage || '決済トークン作成中にエラーが発生しました'
    });
  }
};

// APIエンドポイント 8.2: サブスクリプション作成
export const createSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = createSubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const { organizationId, plan, paymentMethodId, trialDays, metadata } = value;

    if (req.user?.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'この組織のサブスクリプションを作成する権限がありません'
      });
    }

    if (!['owner', 'admin'].includes(req.user?.currentRole || '')) {
      return res.status(403).json({
        success: false,
        error: 'サブスクリプション作成権限がありません'
      });
    }

    const subscription = await subscriptionService.createSubscription({
      organizationId,
      plan,
      paymentMethodId,
      trialDays,
      metadata
    });

    logger.info('Subscription created successfully', {
      subscriptionId: subscription._id,
      organizationId,
      plan,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: {
        id: subscription._id,
        organizationId: subscription.organizationId,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        createdAt: subscription.createdAt
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to create subscription', {
      error: errorMessage,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'サブスクリプション作成中にエラーが発生しました'
    });
  }
};

// APIエンドポイント 8.3: トークンチャージ購入
export const chargeTokens = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = tokenChargeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const { organizationId, tokenPackage, paymentMethodId } = value;

    if (req.user?.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'この組織のトークンチャージを実行する権限がありません'
      });
    }

    if (!['owner', 'admin'].includes(req.user?.currentRole || '')) {
      return res.status(403).json({
        success: false,
        error: 'トークンチャージ権限がありません'
      });
    }

    const { invoice, charge } = await billingService.chargeTokens({
      organizationId,
      tokenPackage,
      paymentMethodId
    });

    const packageDetails = await billingService.getTokenPackageDetails(tokenPackage);

    logger.info('Token charge processed successfully', {
      invoiceId: invoice._id,
      chargeId: charge.id,
      tokenPackage,
      amount: packageDetails.price,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: {
        invoiceId: invoice._id,
        chargeId: charge.id,
        status: charge.status,
        amount: packageDetails.price,
        tokenAmount: packageDetails.tokenAmount,
        packageType: tokenPackage,
        processedAt: new Date()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to charge tokens', {
      error: errorMessage,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'トークンチャージ中にエラーが発生しました'
    });
  }
};

// APIエンドポイント 8.4: 請求サマリー取得
export const getBillingSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: '組織IDが見つかりません'
      });
    }

    if (!['owner', 'admin'].includes(req.user?.currentRole || '')) {
      return res.status(403).json({
        success: false,
        error: '請求サマリー閲覧権限がありません'
      });
    }

    const billingSummary = await billingService.getBillingSummary(organizationId);
    const paymentMethods = await billingService.getPaymentMethods(organizationId);
    const subscription = await subscriptionService.getSubscriptionByOrganization(organizationId);

    logger.info('Billing summary retrieved', {
      organizationId,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: {
        summary: billingSummary,
        subscription: subscription ? {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
        } : null,
        paymentMethods: paymentMethods.map(pm => ({
          id: pm._id,
          type: pm.type,
          last4: pm.last4,
          expiryMonth: pm.expiryMonth,
          expiryYear: pm.expiryYear,
          brand: pm.brand,
          isDefault: pm.isDefault
        })),
        tokenPackages: [
          await billingService.getTokenPackageDetails(TokenPackage.STANDARD),
          await billingService.getTokenPackageDetails(TokenPackage.PREMIUM)
        ]
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get billing summary', {
      error: errorMessage,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: errorMessage || '請求サマリー取得中にエラーが発生しました'
    });
  }
};

// APIエンドポイント 8.5: 請求書一覧取得
export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = billingQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: '組織IDが見つかりません'
      });
    }

    if (!['owner', 'admin'].includes(req.user?.currentRole || '')) {
      return res.status(403).json({
        success: false,
        error: '請求書一覧閲覧権限がありません'
      });
    }

    const { limit } = value;
    const invoices = await billingService.getInvoicesByOrganization(organizationId, limit);

    logger.info('Invoices retrieved', {
      organizationId,
      count: invoices.length,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: {
        invoices: invoices.map(invoice => ({
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          status: invoice.status,
          total: invoice.total,
          type: invoice.type,
          billingPeriod: invoice.billingPeriod,
          items: invoice.items,
          subtotal: invoice.subtotal,
          tax: invoice.tax
        })),
        pagination: {
          total: invoices.length,
          limit: limit
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get invoices', {
      error: errorMessage,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: errorMessage || '請求書一覧取得中にエラーが発生しました'
    });
  }
};

// Webhook処理（認証不要）
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const signature = req.headers['x-univapay-signature'] as string;
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Webhook署名が見つかりません'
      });
    }

    await billingService.processWebhook(value, signature);

    logger.info('Webhook processed successfully', {
      eventType: value.type,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to process webhook', {
      error: errorMessage,
      body: req.body
    });

    // Webhookエラーでも200を返す（リトライを防ぐため）
    res.status(200).json({
      success: false,
      error: errorMessage
    });
  }
};

// 管理用エンドポイント（組織のサブスクリプション管理）
export const updateSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const updateData = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'サブスクリプションIDが必要です'
      });
    }

    if (!['owner', 'admin'].includes(req.user?.currentRole || '')) {
      return res.status(403).json({
        success: false,
        error: 'サブスクリプション更新権限がありません'
      });
    }

    const subscription = await subscriptionService.updateSubscription(subscriptionId, updateData);

    res.status(200).json({
      success: true,
      data: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        updatedAt: subscription.updatedAt
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to update subscription', {
      error: errorMessage,
      subscriptionId: req.params.subscriptionId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'サブスクリプション更新中にエラーが発生しました'
    });
  }
};

// サブスクリプションキャンセル
export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtPeriodEnd = true } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'サブスクリプションIDが必要です'
      });
    }

    if (!['owner', 'admin'].includes(req.user?.currentRole || '')) {
      return res.status(403).json({
        success: false,
        error: 'サブスクリプションキャンセル権限がありません'
      });
    }

    const subscription = await subscriptionService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

    res.status(200).json({
      success: true,
      data: {
        id: subscription._id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to cancel subscription', {
      error: errorMessage,
      subscriptionId: req.params.subscriptionId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'サブスクリプションキャンセル中にエラーが発生しました'
    });
  }
};

// 収益シミュレーションデータ取得（SuperAdmin用）
export const getSimulationData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // SuperAdmin権限チェック
    if (req.user?.currentRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: '収益シミュレーションデータへのアクセス権限がありません'
      });
    }

    const simulationData = await RevenueSimulationService.getSimulationData();

    logger.info('Revenue simulation data retrieved', {
      userId: req.user?.id,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: simulationData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get simulation data', {
      error: errorMessage,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || '収益シミュレーションデータ取得中にエラーが発生しました'
    });
  }
};