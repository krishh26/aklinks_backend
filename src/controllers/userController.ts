import { Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';

export const updateProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { name, email } = req.body;
    const userId = req.params.id;

    // Check if email is being updated and if it's already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        res.status(400).json({
          status: 'error',
          message: 'Email is already taken by another user'
        });
        return;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(email && { email })
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        status: 'error',
        message: 'User does not have a password set'
      });
      return;
    }

    if (user.provider === 'google') {
      res.status(400).json({ message: 'Google login users cannot change password.' });
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password as string);
    if (!isPasswordValid) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid old password'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search as string || '';
    
    const users = await User.find({ name: { $regex: search, $options: 'i' } })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      status: 'success',
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (req.user && (req.user._id as any).toString() === userId) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot change your own role'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (req.user && (req.user._id as any).toString() === userId) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
      return;
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: {
        deletedUser: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
