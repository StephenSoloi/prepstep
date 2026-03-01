import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('M-Pesa Callback response received:', JSON.stringify(body, null, 2));

        // Here you would check the result code:
        // const resultCode = body.Body?.stkCallback?.ResultCode;
        // Update the user's tier in the database depending on the success or failure (ResultCode === 0 implies success)

        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        console.error('Callback error processing logic:', error);
        return NextResponse.json({ error: 'Failed to process callback' }, { status: 500 });
    }
}
