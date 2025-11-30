/**
 * AI Comment Generation for the Dashboard
 * 
 * Uses Google Gemini API directly from the browser.
 * API key is loaded from root .env file during build (via vite.config.ts).
 * 
 * Uses the same GEMINI_API_KEY as the Python bot.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface RedditPost {
  title: string
  subreddit: string
  selftext: string
  score: number
  num_comments: number
}

const SYSTEM_PROMPT = `You are a casual Reddit user writing comments. Your comments should:

1. Sound like a real person, not an AI
2. Use lowercase, casual language
3. Be 1-3 sentences max
4. Include Reddit-style elements:
   - Start with lowercase
   - Use "honestly", "tbh", "ngl", "lol" naturally
   - Be relatable and conversational
   - Share a brief personal take or experience
   - Maybe ask a follow-up question

DON'T:
- Be too formal or structured
- Use bullet points or lists
- Start with "Great question!" or similar
- Sound like customer service
- Be too long or preachy

Examples of good Reddit comments:
- "python. ngl i tried java first and wanted to throw my laptop out the window"
- "tbh the best part about working from home is nobody can see me eating cereal at 2pm"
- "this happened to me once and i just pretended i didnt see it lol"
- "honestly surprised this isnt more common. my whole family does this"`

export async function generateComment(post: RedditPost): Promise<string> {
  if (!GEMINI_API_KEY) {
    // Return demo comment if no API key
    return generateDemoComment(post)
  }

  const userPrompt = `Write a Reddit comment for this post:

Subreddit: r/${post.subreddit}
Title: ${post.title}
${post.selftext ? `Content: ${post.selftext.slice(0, 500)}` : ''}

Write a casual, human-sounding comment (1-3 sentences).`

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 256,
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Gemini API error:', error)
      throw new Error('Failed to generate comment')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Empty response from Gemini')
    }

    return text.trim()
  } catch (error) {
    console.error('Error generating comment:', error)
    return generateDemoComment(post)
  }
}

// Demo comments for when no API key is configured
function generateDemoComment(post: RedditPost): string {
  const demoComments: Record<string, string[]> = {
    'AskReddit': [
      "honestly this happened to me last week and i still think about it lol",
      "tbh i never thought about it that way. kinda makes sense tho",
      "lol my friend does this all the time and we always give him shit for it",
      "ngl this is the most relatable thing ive seen today",
    ],
    'NoStupidQuestions': [
      "tbh i wondered about this for years before finally googling it",
      "wait i always thought it was the other way around lol",
      "honestly the real answer is probably somewhere in between",
    ],
    'explainlikeimfive': [
      "this explanation finally made it click for me tbh",
      "honestly ive been doing it wrong this whole time lol",
      "ngl wish someone explained it to me like this years ago",
    ],
    'default': [
      "honestly same. its wild how common this is",
      "lol this is so accurate it hurts",
      "tbh i never thought id see someone put this into words so well",
    ]
  }

  const comments = demoComments[post.subreddit] || demoComments['default']
  return comments[Math.floor(Math.random() * comments.length)]
}

export function isAIConfigured(): boolean {
  return !!GEMINI_API_KEY
}

