export interface AppNotification {
  _id: string;
  recipient: string;
  sender: string;
  type: 'review' | 'save' | 'reply' | 'helpful';
  recipeId: string;
  recipeTitle: string;
  recipeImage?: string;
  senderName: string;
  senderAvatar?: string;
  read: boolean;
  groupedCount?: number;
  createdAt: string;
  updatedAt: string;
}
