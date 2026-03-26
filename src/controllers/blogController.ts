import { Request, Response, NextFunction } from 'express';
import Blog from '../models/Blog';

/**
 * Create Blog
 */
export const createBlog = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Type and content are required'
      });
    }

    const blog = await Blog.create({
      type,
      content,
      createdBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    next(error);
  }
};


/**
 * List Blogs
 */
export const listBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const blogs = await Blog.find()
      .select('-__v')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      message: 'Blogs retrieved successfully',
      data: blogs
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Get Blog Details
 */
export const getBlogDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { id } = req.params;

    const blog = await Blog.findById(id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Blog details retrieved successfully',
      data: blog
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Update Blog
 */
export const updateBlog = async (req: any, res: Response, next: NextFunction) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { type, content } = req.body;

    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        type,
        content,
        updatedBy: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Blog updated successfully',
      data: blog
    });

  } catch (error) {
    next(error);
  }
};