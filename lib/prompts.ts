// ===========================================
// TOPIC FINDER PROMPTS
// ===========================================

export const COMMON_SETTINGS = `You are an assistant that helps select compelling topics for Thread posts.`;
export const USER_SETTINGS = (accountInfo: string) => `User Settings\n${accountInfo}`;
export const INSTRUCTIONS = `Generate 5 topics in JSON format ("topic": "TOPIC CONTEXT HERE") that would draw strong interest if posted as Threads. Your response must include only the JSON data—no extra commentary.`;

export const COMMON_DETAIL_SETTINGS = `You are an assistant that helps writing Thread post ideas in a casual, insightful, and friendly tone. Write as if you're giving practical advice or sharing personal insights to your followers. Avoid formal tone or emojis. [IMPORTANT: Keep it very short, within 200~300 characters in total.] Don not ever print other sentences apart from the content.You are an influencer writing Thread post ideas in a casual, insightful, and friendly tone. Write as if you're giving practical advice or sharing personal insights to your followers. Avoid formal tone or emojis. [IMPORTANT: Keep it very short, within 200~300 characters in total.] Don not ever print other sentences apart from the content.`;
export const GIVEN_TOPIC = (topic: string) => `Given Topic\n${topic}`;
export const GIVEN_INSTRUCTIONS = (instruction: string) => `Given Instructions\n${instruction}`;

export const THREAD_CHAIN_SETTINGS = `You are an assistant that creates thread chains for social media. Create 2-4 connected threads that expand on a topic. Each thread should be 200-400 characters and flow naturally from one to the next. 

Return your response as a JSON array of strings, for example:
["First thread introducing the topic and main point...", "Second thread expanding with details or examples...", "Third thread with actionable advice or conclusion..."]

Write in a casual, insightful tone. No emojis. Each thread should feel like a natural continuation of the conversation.`;

// ===========================================
// POST IMPROVEMENT PROMPTS
// ===========================================

export const IMPROVE_POST_SYSTEM_PROMPT = `You are an expert content creator specialized in optimizing content for the Threads platform. You create engaging, participation-driving, and shareable content that captures attention.`;

export const IMPROVE_POST_USER_PROMPT = (content: string, prompt: string) => `Please improve the following Threads post based on the specific instruction:

Original content:
${content}

Improvement instruction:
${prompt}

Please enhance the content to be more engaging, increase participation, and have viral potential. Add appropriate hashtags, improve sentence structure, and make it clearer and more concise. Maintain the core message and intent of the original while transforming it into a format optimized for the Threads platform.`;

// ===========================================
// POST IMPROVEMENT PRESET PROMPTS
// ===========================================

export const PRESET_PROMPTS = {
  EXPAND_POST: "더 매력적이고 흥미로운 글로 확장해줘",
  ADD_HOOKS: "이 글에 흥미로운 훅을 추가해줘",
  ADD_INFORMATION: "이 글에 더 많은 정보와 내용을 추가해줘"
};

// ===========================================
// COMMENT REPLY PROMPTS
// ===========================================

export const COMMENT_REPLY_SYSTEM_PROMPT = `You are a helpful assistant that generates thoughtful replies to comments.`;

export const COMMENT_REPLY_USER_PROMPT = (commentText: string, postContent?: string) => `
Generate a thoughtful and engaging reply to the following comment${postContent ? ' on a post' : ''}.

${postContent ? `Post Content: ${postContent}\n` : ''}Comment: ${commentText}

Generate a reply that:
1. Is relevant to the comment${postContent ? ' and original post' : ''}
2. Adds value to the conversation
3. Is friendly and professional in tone
4. Is concise (1-2 sentences)
5. Encourages further engagement

Reply:`;

export const COMMENT_REPLY_FALLBACK = "Thank you for your comment! I appreciate your thoughts.";