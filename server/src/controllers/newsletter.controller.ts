import { Request, Response } from 'express';
import { Newsletter } from '../models/newsletter.model';

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if already subscribed
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (!existingSubscriber.isActive) {
        existingSubscriber.isActive = true;
        await existingSubscriber.save();
        return res.status(200).json({ message: 'Welcome back! You have been re-subscribed to the newsletter.' });
      }
      return res.status(400).json({ message: 'This email is already subscribed.' });
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({ message: 'Successfully subscribed to the newsletter!' });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while subscribing.' });
  }
};
