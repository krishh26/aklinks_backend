import { Request, Response } from 'express';
import Link from '../models/Link';
import crypto from 'crypto';

// Generate a unique short link
const generateShortLink = (): string => {
  // Generate 8 random characters using alphanumeric characters
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  return result;
};

// Create a new shortened link
export const createLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalLink } = req.body;
    const userId = (req as any).user?._id; // Get user ID from authenticated request

    if (!originalLink) {
      res.status(400).json({
        status: 'error',
        message: 'Original link is required'
      });
      return;
    }

    // Validate URL format
    try {
      new URL(originalLink);
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid URL format'
      });
      return;
    }

    // Generate unique short link
    let shortLink = generateShortLink();
    let isUnique = false;

    // Ensure uniqueness (excluding soft deleted links)
    while (!isUnique) {
      const existingLink = await Link.findOne({ shortLink, deleted: false });
      if (!existingLink) {
        isUnique = true;
      } else {
        shortLink = generateShortLink();
      }
    }

    // Create the link
    const link = await Link.create({
      originalLink,
      shortLink,
      userId
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: link._id,
        originalLink: link.originalLink,
        shortLink: link.shortLink,
        clicks: link.clicks,
        createdAt: link.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create link'
    });
  }
};

// Get all links for the authenticated user (excluding soft deleted)
export const getAllLinks = async (req: Request, res: Response): Promise<void> => {
  try {

    const links = await Link.find({ deleted: false })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      status: 'success',
      data: links
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch links'
    });
  }
};

// Soft delete a link
export const deleteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?._id; // Get user ID from authenticated request

    if (!id) {
      res.status(400).json({
        status: 'error',
        message: 'Link ID is required'
      });
      return;
    }

    // Find the link and verify ownership
    const link = await Link.findOne({ _id: id, userId });

    if (!link) {
      res.status(404).json({
        status: 'error',
        message: 'Link not found or you do not have permission to delete it'
      });
      return;
    }

    // Soft delete - update deleted flag and deletedAt timestamp
    link.deleted = true;
    link.deletedAt = new Date();
    await link.save();

    res.status(200).json({
      status: 'success',
      message: 'Link deleted successfully',
      data: {
        id: link._id
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete link'
    });
  }
};

// Get links for a user by user id (admin)
export const getLinksByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

    const links = await Link.find({ userId, deleted: false })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      status: 'success',
      data: links
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch links by user id'
    });
  }
};

// Admin soft delete any link by id
export const adminDeleteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        status: 'error',
        message: 'Link ID is required'
      });
      return;
    }

    const link = await Link.findById(id);

    if (!link) {
      res.status(404).json({
        status: 'error',
        message: 'Link not found'
      });
      return;
    }

    link.deleted = true;
    link.deletedAt = new Date();
    await link.save();

    res.status(200).json({
      status: 'success',
      message: 'Link deleted successfully by admin',
      data: {
        id: link._id
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete link'
    });
  }
};

