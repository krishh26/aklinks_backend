import { Request, Response } from 'express';
import TrafficSource from '../models/TrafficSource';

// Create traffic source (User)
export const createTrafficSource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trafficSource, site } = req.body;
        const userId = (req as any).user?._id;

        if (!trafficSource || !site) {
            res.status(400).json({ status: 'error', message: 'Fields required' });
            return;
        }

        const entry = await TrafficSource.create({
            userId,
            trafficSource,
            site
        });

        res.status(201).json({
            status: 'success',
            data: entry
        });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Get own sources
export const getMyTrafficSources = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;

        const data = await TrafficSource.find({ userId, deleted: false })
            .sort({ dateAdded: -1 });

        res.status(200).json({
            status: 'success',
            data
        });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Update own source
export const updateMyTrafficSource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { trafficSource, site } = req.body;
        const userId = (req as any).user?._id;

        const updated = await TrafficSource.findOneAndUpdate(
            { _id: id, userId },
            { trafficSource, site },
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ status: 'error', message: 'Not found' });
            return;
        }

        res.status(200).json({ status: 'success', data: updated });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Soft delete own source
export const deleteMyTrafficSource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?._id;

        const entry = await TrafficSource.findOneAndUpdate(
            { _id: id, userId },
            { deleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!entry) {
            res.status(404).json({ status: 'error', message: 'Not found' });
            return;
        }

        res.status(200).json({ status: 'success', message: 'Deleted successfully' });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Get all traffic sources (Admin)
export const getAllTrafficSources = async (req: Request, res: Response): Promise<void> => {
    try {
        const { deleted } = req.query;

        let filter: any = {};

        if (deleted === 'true') {
            filter.deleted = true;
        } else if (deleted === 'false') {
            filter.deleted = false;
        }
        const data = await TrafficSource.find(filter)
            .populate('userId', 'name email')
            .sort({ dateAdded: -1 });

        res.status(200).json({ status: 'success', data });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Update status (Admin)
export const updateTrafficSourceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const entry = await TrafficSource.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!entry) {
            res.status(404).json({ status: 'error', message: 'Not found' });
            return;
        }

        res.status(200).json({ status: 'success', data: entry });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Hard delete admin only
export const deleteTrafficSourceAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await TrafficSource.findByIdAndDelete(id);

        res.status(200).json({ status: 'success', message: 'Deleted successfully' });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
