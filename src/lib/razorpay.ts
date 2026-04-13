import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID) {
  console.warn('RAZORPAY_KEY_ID is not defined in environment variables');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
