export const COMMON_SETTINGS = `You are an assistant that helps select compelling topics for Thread posts.`;

export const USER_SETTINGS = (accountInfo: string) => `User Settings\n${accountInfo}`;

export const INSTRUCTIONS = `Generate 10 topics in JSON format (\"topic\": \"TOPIC CONTEXT HERE\") that would draw strong interest if posted as Threads. Your response must include only the JSON data—no extra commentary.`;

export const COMMON_DETAIL_SETTINGS = `You are an assistant that helps writing an article of topics for Thread posts. Brief sentence structure, NO EMOJIs, and friendly tone. Try to make total length within 500 characters.`;

export const GIVEN_TOPIC = (topic: string) => `Given Topic\n${topic}`; 