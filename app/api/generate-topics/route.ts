import { NextRequest, NextResponse } from 'next/server';
import { COMMON_SETTINGS, USER_SETTINGS, INSTRUCTIONS } from '@/app/(dashboard)/contents-cooker/topic-finder/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { accountInfo } = await req.json();

    const prompt = [
        COMMON_SETTINGS,
        USER_SETTINGS(accountInfo),
        INSTRUCTIONS
    ].join('\n\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
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

    // JSON만 추출해서 반환
    try {
        const json = JSON.parse(text);
        const response = NextResponse.json(json);
        return handleCors(response);
    } catch {
        const response = NextResponse.json({ error: 'Invalid JSON from OpenAI', raw: text }, { status: 500 });
        return handleCors(response);
    }
}

export async function OPTIONS() {
    return handleOptions();
} 