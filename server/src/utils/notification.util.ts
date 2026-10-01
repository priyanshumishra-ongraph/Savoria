import Notification, { NotificationType } from '../models/Notification';
import User from '../models/User';
import Recipe from '../models/Recipe';
import { emitToUser } from '../socket/socket';

export const sendGroupedNotification = async ({
  recipientId,
  senderId,
  type,
  recipeId,
  recipeTitle,
  recipeImage = '',
}: {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  recipeId: string;
  recipeTitle: string;
  recipeImage?: string;
}) => {
  // Prevent sending to self
  if (recipientId === senderId) return;

  // Check user preferences
  const recipient = await User.findById(recipientId).select('notificationPreferences').lean();
  if (recipient && recipient.notificationPreferences) {
    const prefs = recipient.notificationPreferences;
    if (type === 'review' && prefs.onReview === false) return;
    if (type === 'save' && prefs.onSave === false) return;
    if (type === 'reply' && prefs.onReply === false) return;
    if (type === 'helpful' && prefs.onHelpful === false) return;
  }

  const sender = await User.findById(senderId).select('name avatarUrl').lean();
  const senderName = sender?.name ?? 'Someone';
  const senderAvatar = sender?.avatarUrl ?? '';

  // Look for an existing UNREAD notification of the exact same type for the exact same recipe
  let notification = await Notification.findOne({
    recipient: recipientId,
    type,
    recipeId,
    read: false,
  });

  if (notification) {
    // Group it
    notification.sender = senderId as any;
    notification.senderName = senderName;
    notification.senderAvatar = senderAvatar;
    notification.recipeImage = recipeImage;
    notification.groupedCount += 1;
    notification.createdAt = new Date(); // bump to top
    await notification.save();
  } else {
    // Create new
    notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      recipeId,
      recipeTitle,
      recipeImage,
      senderName,
      senderAvatar,
      groupedCount: 0, // 0 additional users
    });
  }

  // Emit updated/new notification
  emitToUser(recipientId, 'new_notification', notification);
};
