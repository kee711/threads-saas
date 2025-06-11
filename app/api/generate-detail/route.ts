import { NextRequest, NextResponse } from 'next/server';
import { COMMON_DETAIL_SETTINGS, USER_SETTINGS, GIVEN_TOPIC } from '@/app/(dashboard)/contents-cooker/topic-finder/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { accountInfo, topic } = await req.json();

    const prompt = [
        COMMON_DETAIL_SETTINGS,
        USER_SETTINGS(accountInfo),
        GIVEN_TOPIC(topic)
    ].join('\n\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            messages: [
                { role: 'system', content: prompt }
            ],
            max_tokens: 512,
            temperature: 0.7,
        })
    });

    if (!openaiRes.ok) {
        return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 });
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content || '';

    const response = NextResponse.json({ detail: text });
    return handleCors(response);
}

export async function OPTIONS() {
    return handleOptions();
} 