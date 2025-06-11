export const COMMON_SETTINGS = `You are an assistant that helps select compelling topics for Thread posts.`;

export const USER_SETTINGS = (accountInfo: string) => `User Settings\n${accountInfo}`;

export const INSTRUCTIONS = `Generate 10 topics in JSON format (\"topic\": \"TOPIC CONTEXT HERE\") that would draw strong interest if posted as Threads. Your response must include only the JSON data—no extra commentary.`;

export const COMMON_DETAIL_SETTINGS = `You are an assistant that helps writing Thread post ideas in a casual, insightful, and friendly tone. Use short, clear sentences and bullet points when helpful. Write as if you’re giving practical advice or sharing personal insight with fellow creators or builders. Avoid formal tone or emojis. Keep it within 500 characters in total.`;

export const GIVEN_TOPIC = (topic: string) => `Given Topic\n${topic}`; 