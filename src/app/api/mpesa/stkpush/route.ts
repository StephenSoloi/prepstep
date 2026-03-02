import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phoneNumber, amount, accountReference, transactionDesc } = body;

        if (!phoneNumber || !amount) {
            return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 });
        }

        const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
        const shortcode = process.env.MPESA_SHORTCODE?.trim() || '174379';
        const passkey = process.env.MPESA_PASSKEY?.trim() || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

        if (!consumerKey || !consumerSecret) {
            console.error('M-Pesa keys missing or empty');
            return NextResponse.json({ error: 'M-Pesa service misconfigured. Keys missing.' }, { status: 500 });
        }

        // 1. Get Access Token
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        const tokenRes = await fetch(tokenUrl, {
            headers: { Authorization: `Basic ${auth}` },
            cache: 'no-store'
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error('M-Pesa auth error:', errorText);
            return NextResponse.json({ error: 'Auth failed with Safaricom.', details: errorText }, { status: 500 });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Initiate STK Push
        const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Foolproof phone formatting
        const clean = phoneNumber.replace(/\D/g, '');
        let formattedPhone;
        if (clean.startsWith('0')) {
            formattedPhone = '254' + clean.substring(1);
        } else if (clean.startsWith('254')) {
            formattedPhone = clean;
        } else {
            formattedPhone = '254' + clean;
        }

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
            AccountReference: (accountReference || 'PrepStep').substring(0, 12),
            TransactionDesc: (transactionDesc || 'Upgrade').substring(0, 20)
        };

        const stkRes = await fetch(stkUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(stkBody),
        });

        const stkText = await stkRes.text();
        let stkData;
        try {
            stkData = JSON.parse(stkText);
        } catch {
            console.error('Raw M-Pesa error response:', stkText);
            return NextResponse.json({
                error: 'Invalid response from M-Pesa.',
                details: stkText.substring(0, 300)
            }, { status: 500 });
        }

        if (!stkRes.ok || stkData.errorMessage || stkData.errorCode) {
            return NextResponse.json({
                error: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed.',
                details: stkData
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: stkData });

    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment Service Errors' }, { status: 500 });
    }
}
