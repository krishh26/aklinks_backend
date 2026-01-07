import { Request, Response } from 'express';
import EventUser from '../models/EventUser';
import { sendEventRegistrationEmail } from '../utils/eventEmailUtils';

// Store event user data
export const createEventUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      res.status(400).json({
        status: 'error',
        message: 'Data field is required and must be an object'
      });
      return;
    }

    const eventUser = await EventUser.create({ data });

    // Send success response immediately
    res.status(201).json({
      status: 'success',
      message: 'Event user data stored successfully',
      data: eventUser
    });

    // Send confirmation email in the background (fire and forget)
    if (data.email) {
      const ticketId = eventUser._id.toString();
      sendEventRegistrationEmail(data.email, data, ticketId).catch((emailError) => {
        console.error('Error sending event registration email:', emailError);
        // Email error doesn't affect the API response
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to store event user data'
    });
  }
};

// Get all event users data
export const getAllEventUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const eventUsers = await EventUser.find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .skip(skip)
      .limit(limit);

    const totalItems = await EventUser.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: 'success',
      data: {
        items: eventUsers,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch event users data'
    });
  }
};

