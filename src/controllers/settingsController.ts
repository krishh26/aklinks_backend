import { Response, NextFunction } from 'express';
import Settings from '../models/Settings';

/**
 * Get currency exchange rate setting
 * Public endpoint - anyone can view the exchange rate
 */
export const getCurrencyExchangeRate = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const setting = await Settings.findOne({ key: 'currency_exchange_rate' });
    
    if (!setting) {
      // If setting doesn't exist, create it with default value
      const defaultSetting = await Settings.create({
        key: 'currency_exchange_rate',
        value: 80,
        description: '1 USD to INR exchange rate'
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Currency exchange rate retrieved successfully',
        data: {
          exchangeRate: defaultSetting.value as number
        }
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Currency exchange rate retrieved successfully',
      data: {
        exchangeRate: setting.value as number
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update currency exchange rate setting
 * Admin only endpoint
 */
export const updateCurrencyExchangeRate = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { exchangeRate } = req.body;

    // Validate exchange rate
    if (!exchangeRate || typeof exchangeRate !== 'number' || exchangeRate <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Exchange rate must be a positive number'
      });
      return;
    }

    // Find or create the setting
    const setting = await Settings.findOneAndUpdate(
      { key: 'currency_exchange_rate' },
      {
        key: 'currency_exchange_rate',
        value: exchangeRate,
        description: '1 USD to INR exchange rate',
        updatedBy: req.user._id
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Currency exchange rate updated successfully',
      data: {
        exchangeRate: setting.value as number,
        updatedAt: setting.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all settings (Admin only)
 */
export const getAllSettings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await Settings.find().select('-__v').sort({ key: 1 });

    res.status(200).json({
      status: 'success',
      message: 'Settings retrieved successfully',
      data: {
        settings: settings.map(setting => ({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

