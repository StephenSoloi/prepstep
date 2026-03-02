import { NextResponse } from 'next/server';

/** Fetch with automatic retry + exponential backoff */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxAttempts = 3,
    baseDelayMs = 1200
): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const res = await fetch(url, options);
            // Retry only on server-side / network errors (5xx); surface 4xx immediately
            if (res.status < 500) return res;
            const body = await res.text();
            console.warn(`Attempt ${attempt} got ${res.status}:`, body.substring(0, 200));
            lastError = new Error(`HTTP ${res.status}: ${body.substring(0, 200)}`);
        } catch (err) {
            lastError = err;
            console.warn(`Attempt ${attempt} network error:`, err);
        }
        if (attempt < maxAttempts) {
            const delay = baseDelayMs * attempt; // 1.2s, 2.4s
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastError;
}

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

        // ── 0. Determine Environment ──────────────────────────────────────
        // If the shortcode is NOT the default sandbox one, we assume production
        const isProduction = shortcode !== '174379';
        const baseUrl = isProduction
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        if (!consumerKey || !consumerSecret) {
            console.error('M-Pesa keys missing or empty');
            return NextResponse.json({ error: 'M-Pesa service misconfigured. Keys missing.' }, { status: 500 });
        }

        // ── 1. Get Access Token (with retry) ──────────────────────────────
        const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenUrl = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

        let accessToken: string;
        try {
            // Use a 15s timeout for auth
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const tokenRes = await fetchWithRetry(tokenUrl, {
                headers: { Authorization: `Basic ${authHeader}` },
                cache: 'no-store',
                signal: controller.signal
            }, 2); // Only 2 attempts for speed

            clearTimeout(timeoutId);

            if (!tokenRes.ok) {
                const errorText = await tokenRes.text();
                console.error('M-Pesa auth error:', errorText);
                return NextResponse.json({ error: 'Could not authenticate with Safaricom. Try again.', details: errorText }, { status: 500 });
            }

            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;

            if (!accessToken) {
                return NextResponse.json({ error: 'No access token returned by Safaricom. Try again.' }, { status: 500 });
            }
        } catch (tokenErr) {
            console.error('M-Pesa token fetch failed:', tokenErr);
            return NextResponse.json({ error: 'Connection to M-Pesa failed. Safaricom might be down or busy.' }, { status: 504 });
        }

        // ── 2. Build STK Push payload (Nairobi Time) ──────────────────────
        // Safaricom expects Africa/Nairobi (EAT) time format: YYYYMMDDHHMMSS
        const nairobiParts = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: 'Africa/Nairobi', hour12: false
        }).formatToParts(new Date());

        const timestamp =
            (nairobiParts.find(p => p.type === 'year')?.value || '') +
            (nairobiParts.find(p => p.type === 'month')?.value || '') +
            (nairobiParts.find(p => p.type === 'day')?.value || '') +
            (nairobiParts.find(p => p.type === 'hour')?.value || '') +
            (nairobiParts.find(p => p.type === 'minute')?.value || '') +
            (nairobiParts.find(p => p.type === 'second')?.value || '');

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Normalise phone → 2547XXXXXXXX
        const clean = phoneNumber.replace(/\D/g, '');
        let formattedPhone: string;
        if (clean.startsWith('0')) {
            formattedPhone = '254' + clean.substring(1);
        } else if (clean.startsWith('254')) {
            formattedPhone = clean;
        } else {
            formattedPhone = '254' + clean;
        }

        const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`
            : 'https://prepstep.vercel.app/api/mpesa/callback';

        const stkBody = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: isProduction ? 'CustomerPayBillOnline' : 'CustomerPayBillOnline',
            Amount: Math.ceil(Number(amount)),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: (accountReference || 'PrepStep').substring(0, 12),
            TransactionDesc: (transactionDesc || 'Upgrade').substring(0, 20),
        };

        // ── 3. Send STK Push (with retry) ─────────────────────────────────
        const stkUrl = `${baseUrl}/mpesa/stkpush/v1/processrequest`;
        let stkRes: Response;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            stkRes = await fetchWithRetry(stkUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(stkBody),
                signal: controller.signal
            }, 2); // 2 attempts max

            clearTimeout(timeoutId);
        } catch (stkErr) {
            console.error('STK Push failed:', stkErr);
            return NextResponse.json({ error: 'M-Pesa STK Push timed out. Safaricom is taking too long to respond.' }, { status: 504 });
        }

        // ── 4. Parse & return Safaricom response ──────────────────────────
        const stkText = await stkRes.text();
        let stkData: Record<string, unknown>;
        try {
            stkData = JSON.parse(stkText);
        } catch {
            console.error('Invalid JSON from Safaricom:', stkText.substring(0, 500));
            return NextResponse.json({
                error: 'M-Pesa returned an invalid response. Please retry in a few seconds.',
            }, { status: 502 });
        }

        if (!stkRes.ok || stkData.errorMessage || stkData.errorCode) {
            console.error('M-Pesa Application Error:', stkData);
            return NextResponse.json({
                error: (stkData.errorMessage as string) || (stkData.ResponseDescription as string) || 'STK Push declined by Safaricom.',
                details: stkData,
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: stkData });

    } catch (error: unknown) {
        console.error('STK Push internal catch:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Payment Service Error' },
            { status: 500 }
        );
    }
}
