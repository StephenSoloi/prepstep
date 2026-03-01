import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phoneNumber, amount, accountReference, transactionDesc } = body;

        if (!phoneNumber || !amount) {
            return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 });
        }

        const consumerKey = process.env.MPESA_CONSUMER_KEY!;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
        const shortcode = process.env.MPESA_SHORTCODE || '174379';
        const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

        // 1. Get Access Token
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        // Sandbox URL for Daraja
        const tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        const tokenRes = await fetch(tokenUrl, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
            cache: 'no-store'
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error('M-Pesa auth error:', errorText);
            return NextResponse.json({ error: 'Failed to authenticate with M-Pesa' }, { status: 500 });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Initiate STK Push
        const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        // Format timestamp: YYYYMMDDHHmmss
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Format phone number to 254...
        let formattedPhone = phoneNumber.replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }

        // Usually callback needs to be real internet-facing HTTPS.
        // For Sandbox, Daraja often requires a reachable endpoint, but we can provide any valid URL string.
        const callbackUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback` : 'https://prepstep.vercel.app/api/mpesa/callback';

        const stkBody = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(Number(amount)),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: accountReference || 'PrepStep Tier Upgrade',
            TransactionDesc: transactionDesc || 'Payment for PrepStep Tier'
        };

        const stkRes = await fetch(stkUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(stkBody),
        });

        const stkData = await stkRes.json();

        if (!stkRes.ok || stkData.errorMessage) {
            console.error('STK Push error:', stkData);
            return NextResponse.json({ error: stkData.errorMessage || 'Failed to initiate STK push' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: stkData });

    } catch (error) {
        console.error('STK API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
