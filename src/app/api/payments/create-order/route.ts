import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, mentorId, slotId } = await req.json();
    
    // Mocking Razorpay Order creation
    // In production, use: response = await razorpay.orders.create({ amount, currency: 'INR' });
    
    console.log(`Creating mock order for Mentor: ${mentorId}, Slot: ${slotId}, Amount: ${amount}`);
    
    return NextResponse.json({
      orderId: `order_${Math.random().toString(36).substring(7)}`,
      amount,
      currency: 'INR',
      status: 'pending',
      message: 'Sandbox order created successfully'
    });
  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
