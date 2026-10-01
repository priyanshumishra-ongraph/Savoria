import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * @desc  Get all notifications for the logged-in user (latest 50)
 * @route GET /api/notifications
 * @access Private
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user!.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ recipient: req.user!.id });
    const hasMore = skip + notifications.length < total;

    res.json({ notifications, hasMore, total });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Get unread count for the logged-in user
 * @route GET /api/notifications/unread-count
 * @access Private
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user!.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Mark a single notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!.id },
      { read: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json(notification);
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Mark ALL notifications as read for the logged-in user
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipient: req.user!.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Delete a single notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user!.id,
    });

    if (!result) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
