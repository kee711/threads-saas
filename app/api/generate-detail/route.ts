import { NextRequest, NextResponse } from 'next/server';
import { COMMON_DETAIL_SETTINGS, USER_SETTINGS, GIVEN_TOPIC, GIVEN_INSTRUCTIONS, THREAD_CHAIN_SETTINGS } from '@/app/(dashboard)/contents-cooker/topic-finder/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { accountInfo, topic, instruction } = await req.json();

    // Generate thread chain instead of single post
    const prompt = [
        THREAD_CHAIN_SETTINGS,
        USER_SETTINGS(accountInfo),
        GIVEN_TOPIC(topic),
        GIVEN_INSTRUCTIONS(instruction)
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
            max_tokens: 800, // Increased for multiple threads
            temperature: 0.7,
        })
    });

    if (!openaiRes.ok) {
        return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 });
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content || '';

    try {
        // Parse the JSON response to get thread chain
        const parsedThreads = JSON.parse(text);
        
        // Ensure it's an array
        const threads = Array.isArray(parsedThreads) ? parsedThreads : [parsedThreads];
        
        const response = NextResponse.json({ threads });
        return handleCors(response);
    } catch (error) {
        // Fallback: split the text into threads if JSON parsing fails
        const threads = text.split('\n\n').filter((t: string) => t.trim()).map((t: string) => t.trim());
        const response = NextResponse.json({ threads });
        return handleCors(response);
    }
}

export async function OPTIONS() {
    return handleOptions();
} 