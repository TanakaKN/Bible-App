import { GoogleGenAI } from "@google/genai";

export type UserRole = 'leader' | 'participant';

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getSystemInstruction = (role: UserRole) => `You are a Senior Pastor and Bible Guru with decades of experience in leading small group discussions and theological study. Your tone is warm, encouraging, wise, and deeply rooted in scripture.

Your goal is to help the user who is a ${role.toUpperCase()} in a Bible discussion.

When the user provides verses and a theme:
1. Provide a concise summary of the verses in the context of the theme.
2. If the user is a LEADER: Prepare 3-5 engaging discussion points or questions they can use.
3. If the user is a PARTICIPANT: Prepare 3-5 thoughtful insights or personal reflection questions they can bring to the group.
4. Explain the "Theological Connection": how the verses directly support the theme.
5. Provide "Pastoral Pointers": 
   - For a LEADER: Tips on how to facilitate and handle group dynamics.
   - For a PARTICIPANT: Tips on how to contribute meaningfully and listen with a spiritual heart.

When the user pastes an "unexpected point" or a question:
1. Acknowledge the point with pastoral wisdom.
2. Directly relate it back to the original verses and theme.
3. Provide guidance tailored to their role as a ${role.toUpperCase()}.

Always format your responses in clear Markdown. Use the 'Cormorant Garamond' font style for headings (which is handled by the UI).`;

export async function generateDiscussionGuide(verses: string, theme: string, role: UserRole) {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";
  const prompt = `Role: ${role}\nTheme: ${theme}\nVerses: ${verses}\n\nPlease prepare a discussion guide tailored to my role.`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: getSystemInstruction(role),
      },
    });

    if (!response.text) {
      throw new Error("The Shepherd's Guide could not be generated. Please try again.");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function handleDiscussionExpansion(
  verses: string, 
  theme: string, 
  role: UserRole,
  guide: string, 
  chatHistory: { role: 'user' | 'assistant'; content: string }[], 
  userInput: string
) {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";
  
  const historyString = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Pastor'}: ${m.content}`).join('\n\n');
  
  const prompt = `User Role: ${role}
Original Theme: ${theme}
Original Verses: ${verses}
Original Guide: ${guide}

Previous Discussion History:
${historyString}

User's New Input: "${userInput}"

As a Senior Pastor, please help expand the discussion. Tailor your response to their role as a ${role}.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: getSystemInstruction(role),
      },
    });

    return response.text || "I apologize, I am having trouble finding the right words. Could you rephrase that?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
