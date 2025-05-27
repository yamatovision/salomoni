import { Response } from 'express';
import { PlanService } from '../services/plan.service';
import { 
  createPlanSchema,
  updatePlanSchema,
  planQuerySchema,
  formatValidationError
} from '../validators/plan.validator';
import { logger } from '../../../common/utils/logger';
import { AuthenticatedRequest } from '../../../common/middleware/auth';
import { UserRole } from '../../../types';

// プラン一覧取得
export const getPlans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = planQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const { type, isActive, page = 1, limit = 20 } = value;
    const offset = (page - 1) * limit;

    const { plans, totalCount } = await PlanService.getPlans({
      type,
      isActive,
      limit,
      offset
    });

    logger.info('Plans retrieved successfully', {
      count: plans.length,
      totalCount,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          type: plan.type,
          price: plan.price,
          billingCycle: plan.billingCycle,
          features: plan.features,
          limits: plan.limits,
          tokenAmount: plan.tokenAmount,
          isActive: plan.isActive,
          displayOrder: plan.displayOrder,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext: offset + plans.length < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get plans', {
      error: errorMessage,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'プラン一覧取得中にエラーが発生しました'
    });
  }
};

// プラン詳細取得
export const getPlanById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'プランIDが必要です'
      });
    }

    const plan = await PlanService.getPlanById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'プランが見つかりません'
      });
    }

    logger.info('Plan retrieved successfully', {
      planId,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features,
        limits: plan.limits,
        tokenAmount: plan.tokenAmount,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
        metadata: plan.metadata,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get plan by ID', {
      error: errorMessage,
      planId: req.params.planId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'プラン詳細取得中にエラーが発生しました'
    });
  }
};

// プラン作成（SuperAdmin専用）
export const createPlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // SuperAdmin権限チェック
    if (req.user?.currentRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'プラン作成権限がありません'
      });
    }

    const { error, value } = createPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const plan = await PlanService.createPlan(value);

    logger.info('Plan created successfully', {
      planId: plan.id,
      planName: plan.name,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features,
        limits: plan.limits,
        tokenAmount: plan.tokenAmount,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
        createdAt: plan.createdAt
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to create plan', {
      error: errorMessage,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'プラン作成中にエラーが発生しました'
    });
  }
};

// プラン更新（SuperAdmin専用）
export const updatePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // SuperAdmin権限チェック
    if (req.user?.currentRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'プラン更新権限がありません'
      });
    }

    const { planId } = req.params;
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'プランIDが必要です'
      });
    }

    const { error, value } = updatePlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    const plan = await PlanService.updatePlan(planId, value);

    logger.info('Plan updated successfully', {
      planId,
      updatedFields: Object.keys(value),
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features,
        limits: plan.limits,
        tokenAmount: plan.tokenAmount,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to update plan', {
      error: errorMessage,
      planId: req.params.planId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'プラン更新中にエラーが発生しました'
    });
  }
};

// プラン削除（SuperAdmin専用）
export const deletePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // SuperAdmin権限チェック
    if (req.user?.currentRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'プラン削除権限がありません'
      });
    }

    const { planId } = req.params;
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'プランIDが必要です'
      });
    }

    await PlanService.deletePlan(planId);

    logger.info('Plan deleted successfully', {
      planId,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      message: 'プランが正常に削除されました'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to delete plan', {
      error: errorMessage,
      planId: req.params.planId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: errorMessage || 'プラン削除中にエラーが発生しました'
    });
  }
};