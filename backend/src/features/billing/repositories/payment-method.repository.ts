import { FilterQuery, UpdateQuery } from 'mongoose';
import { PaymentMethod, IPaymentMethod } from '../models/payment-method.model';
import { ID } from '../../../types/index';
import { logger } from '../../../common/utils/logger';

export class PaymentMethodRepository {
  async create(data: Partial<IPaymentMethod>): Promise<IPaymentMethod> {
    try {
      const paymentMethod = new PaymentMethod(data);
      await paymentMethod.save();
      logger.info('Payment method created', { paymentMethodId: paymentMethod._id, organizationId: paymentMethod.organizationId });
      return paymentMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create payment method', { error: errorMessage, data });
      throw new Error(`支払い方法作成に失敗しました: ${errorMessage}`);
    }
  }

  async findById(id: ID): Promise<IPaymentMethod | null> {
    try {
      return await PaymentMethod.findById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment method by ID', { error: errorMessage, id });
      throw new Error(`支払い方法取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByOrganizationId(organizationId: ID): Promise<IPaymentMethod[]> {
    try {
      return await PaymentMethod.find({ organizationId }).sort({ isDefault: -1, createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment methods by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の支払い方法取得に失敗しました: ${errorMessage}`);
    }
  }

  async findDefaultByOrganizationId(organizationId: ID): Promise<IPaymentMethod | null> {
    try {
      return await PaymentMethod.findOne({ organizationId, isDefault: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find default payment method', { error: errorMessage, organizationId });
      throw new Error(`デフォルト支払い方法取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByUnivapayTokenId(univapayTokenId: string): Promise<IPaymentMethod | null> {
    try {
      return await PaymentMethod.findOne({ univapayTokenId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment method by Univapay token ID', { error: errorMessage, univapayTokenId });
      throw new Error(`Univapayトークンでの支払い方法取得に失敗しました: ${errorMessage}`);
    }
  }

  async update(id: ID, data: UpdateQuery<IPaymentMethod>): Promise<IPaymentMethod | null> {
    try {
      const paymentMethod = await PaymentMethod.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (paymentMethod) {
        logger.info('Payment method updated', { paymentMethodId: id, updatedFields: Object.keys(data) });
      }
      
      return paymentMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update payment method', { error: errorMessage, id, data });
      throw new Error(`支払い方法更新に失敗しました: ${errorMessage}`);
    }
  }

  async setAsDefault(id: ID, organizationId: ID): Promise<IPaymentMethod | null> {
    try {
      await PaymentMethod.updateMany(
        { organizationId },
        { $set: { isDefault: false } }
      );
      
      const paymentMethod = await this.update(id, { isDefault: true });
      
      if (paymentMethod) {
        logger.info('Payment method set as default', { paymentMethodId: id, organizationId });
      }
      
      return paymentMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to set payment method as default', { error: errorMessage, id, organizationId });
      throw new Error(`デフォルト支払い方法設定に失敗しました: ${errorMessage}`);
    }
  }

  async findAll(filter: FilterQuery<IPaymentMethod> = {}): Promise<IPaymentMethod[]> {
    try {
      return await PaymentMethod.find(filter).sort({ isDefault: -1, createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment methods', { error: errorMessage, filter });
      throw new Error(`支払い方法一覧取得に失敗しました: ${errorMessage}`);
    }
  }

  async countByOrganization(organizationId: ID): Promise<number> {
    try {
      return await PaymentMethod.countDocuments({ organizationId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to count payment methods by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の支払い方法数取得に失敗しました: ${errorMessage}`);
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const paymentMethod = await PaymentMethod.findById(id);
      if (!paymentMethod) {
        return false;
      }

      if (paymentMethod.isDefault) {
        const otherMethods = await PaymentMethod.find({ 
          organizationId: paymentMethod.organizationId, 
          _id: { $ne: id } 
        }).sort({ createdAt: 1 });
        
        if (otherMethods.length > 0 && otherMethods[0]) {
          await this.setAsDefault(otherMethods[0]._id, paymentMethod.organizationId);
        }
      }

      const result = await PaymentMethod.findByIdAndDelete(id);
      if (result) {
        logger.info('Payment method deleted', { paymentMethodId: id });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete payment method', { error: errorMessage, id });
      throw new Error(`支払い方法削除に失敗しました: ${errorMessage}`);
    }
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();