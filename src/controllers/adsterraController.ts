import { Request, Response } from 'express';
import Settings from '../models/Settings';

const ADSTERRA_API_BASE = 'https://api3.adsterratools.com/publisher';

/**
 * Get Adsterra API key from settings
 */
const getApiKey = async (): Promise<string | null> => {
  const setting = await Settings.findOne({ key: 'adsterra_api_key' });
  return setting?.value as string | null;
};

/**
 * Make request to Adsterra API
 * - Adds a timeout to avoid hanging requests
 * - Normalizes JSON parsing
 */
const adsterraRequest = async (
  endpoint: string,
  apiKey: string
): Promise<any> => {
  const url = `${ADSTERRA_API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s safety timeout

  try {
    console.log('[Adsterra] Request ->', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-Key': apiKey,
      },
      signal: controller.signal,
    });

    console.log('[Adsterra] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Adsterra API error: ${response.status} - ${errorText || response.statusText}`
      );
    }

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (parseErr: any) {
      throw new Error(`Failed to parse Adsterra response JSON: ${parseErr?.message || parseErr}`);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Adsterra API request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Get all domains (websites) from Adsterra
 * GET /domains.json
 */
export const getDomains = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      res.status(400).json({
        status: 'error',
        message: 'Adsterra API key is not configured. Please add it in Settings.',
      });
      return;
    }

    const data = await adsterraRequest('/domains.json', apiKey);
    res.status(200).json({
      status: 'success',
      data: data.data || data,
    });
  } catch (error: any) {
    console.error('Adsterra getDomains error:', error);
    res.status(error.message?.includes('401') ? 401 : 500).json({
      status: 'error',
      message: error.message || 'Failed to fetch domains from Adsterra',
    });
  }
};

/**
 * Get placements for a specific domain
 * GET /domain/{domain_id}/placements.json
 */
export const getDomainPlacements = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { domainId } = req.params;
    const apiKey = await getApiKey();

    if (!apiKey) {
      res.status(400).json({
        status: 'error',
        message: 'Adsterra API key is not configured. Please add it in Settings.',
      });
      return;
    }

    if (!domainId) {
      res.status(400).json({
        status: 'error',
        message: 'Domain ID is required',
      });
      return;
    }

    const data = await adsterraRequest(
      `/domain/${domainId}/placements.json`,
      apiKey
    );
    res.status(200).json({
      status: 'success',
      data: data.data || data,
    });
  } catch (error: any) {
    console.error('Adsterra getDomainPlacements error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch placements for domain',
    });
  }
};

/**
 * Get all placements
 * GET /placements.json
 */
export const getAllPlacements = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      res.status(400).json({
        status: 'error',
        message: 'Adsterra API key is not configured. Please add it in Settings.',
      });
      return;
    }

    const data = await adsterraRequest('/placements.json', apiKey);
    res.status(200).json({
      status: 'success',
      data: data.data || data,
    });
  } catch (error: any) {
    console.error('Adsterra getAllPlacements error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch placements',
    });
  }
};

/**
 * Get SmartLinks
 * GET /smart-links.json
 * Query params: status (3=Active, 4=Inactive), traffic_type (1=Mainstream, 2=Adult)
 */
export const getSmartLinks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      res.status(400).json({
        status: 'error',
        message: 'Adsterra API key is not configured. Please add it in Settings.',
      });
      return;
    }

    const { status, traffic_type } = req.query;
    let endpoint = '/smart-links.json';
    const params = new URLSearchParams();
    if (status) params.append('status', String(status));
    if (traffic_type) params.append('traffic_type', String(traffic_type));
    if (params.toString()) endpoint += `?${params.toString()}`;

    const data = await adsterraRequest(endpoint, apiKey);
    res.status(200).json({
      status: 'success',
      data: data.data || data,
    });
  } catch (error: any) {
    console.error('Adsterra getSmartLinks error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch SmartLinks',
    });
  }
};

/**
 * Get statistics
 * GET /stats.json
 * Query params: domain, placement, start_date, finish_date, group_by, country, placement_sub_id
 */
export const getStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('[Adsterra] /stats request received', req.query);
    const apiKey = await getApiKey();
    console.log('apiKey', apiKey);
    if (!apiKey) {
      res.status(400).json({
        status: 'error',
        message: 'Adsterra API key is not configured. Please add it in Settings.',
      });
      return;
    }

    const {
      domain,
      placement,
      start_date,
      finish_date,
      group_by,
      country,
      placement_sub_id,
    } = req.query;

    const params = new URLSearchParams();
    if (domain) params.append('domain', String(domain));
    if (placement) params.append('placement', String(placement));
    if (start_date) params.append('start_date', String(start_date));
    if (finish_date) params.append('finish_date', String(finish_date));
    if (group_by) params.append('group_by', String(group_by));
    if (country) params.append('country', String(country));
    if (placement_sub_id) params.append('placement_sub_id', String(placement_sub_id));

    let endpoint = '/stats.json';
    if (params.toString()) endpoint += `?${params.toString()}`;

    const data = await adsterraRequest(endpoint, apiKey);
    console.log('[Adsterra] /stats response received', data);
    res.status(200).json({
      status: 'success',
      data: data,
    });
  } catch (error: any) {
    console.error('Adsterra getStatistics error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch statistics',
    });
  }
};

/**
 * Get Adsterra API key (masked) - Admin only
 */
export const getAdsterraApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const setting = await Settings.findOne({ key: 'adsterra_api_key' });
    const hasKey = !!setting?.value;
    const masked = hasKey
      ? String(setting.value).slice(0, 4) + '****' + String(setting.value).slice(-4)
      : null;

    res.status(200).json({
      status: 'success',
      data: {
        hasApiKey: hasKey,
        maskedKey: masked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get API key status',
    });
  }
};

/**
 * Update Adsterra API key - Admin only
 */
export const updateAdsterraApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      res.status(400).json({
        status: 'error',
        message: 'API key is required',
      });
      return;
    }

    await Settings.findOneAndUpdate(
      { key: 'adsterra_api_key' },
      {
        key: 'adsterra_api_key',
        value: apiKey.trim(),
        description: 'Adsterra Publishers API key (from API page in Adsterra panel)',
        updatedBy: (req as any).user?._id,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Adsterra API key updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update API key',
    });
  }
};
