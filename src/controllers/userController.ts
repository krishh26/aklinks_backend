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
    const status = req.query.status as string || 'all';
    const role = req.query.role as string || 'all';
    const dateFrom = req.query.dateFrom as string || '';
    const dateTo = req.query.dateTo as string || '';

    // Build filter object
    let filter: any = {};
    const andConditions: any[] = [];

    // Search filter: search in name and email
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Status filter: 'active' means isActive: true or undefined/null (default active)
    // 'inactive' means isActive: false
    if (status === 'active') {
      // Include users where isActive is true OR isActive doesn't exist (defaults to active)
      andConditions.push({
        $or: [
          { isActive: true },
          { isActive: { $exists: false } }
        ]
      });
    } else if (status === 'inactive') {
      andConditions.push({ isActive: false });
    }
    // 'all' - no filter on isActive

    // Role filter
    if (role !== 'all') {
      andConditions.push({ role: role });
    }

    // Date range filter for createdAt
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        dateFilter.$gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
      andConditions.push({ createdAt: dateFilter });
    }

    // Combine all conditions with $and if we have multiple conditions
    // Otherwise, use simple filter structure
    if (andConditions.length > 1) {
      filter.$and = andConditions;
    } else if (andConditions.length === 1) {
      filter = andConditions[0];
    }

    // Get total count with filters
    const totalUsers = await User.countDocuments(filter);
    
    // Get users with filters
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Map isActive to status for frontend compatibility
    const mappedUsers = users.map(user => ({
      ...user.toObject(),
      status: user.isActive ? 'active' : 'inactive'
    }));

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      status: 'success',
      message: 'Users retrieved successfully',
      data: {
        users: mappedUsers,
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

export const getUserById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'User retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          status: user.isActive ? 'active' : 'inactive',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

    // Prevent admin from deactivating themselves
    if (req.user && (req.user._id as any).toString() === userId) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot change your own status'
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    // Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        isActive: user.isActive,
        status: user.isActive ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    next(error);
  }
};