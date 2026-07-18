import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ─── Subscription check: premium or max only ───
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();
    const plan = profile?.subscription_plan || 'free';
    if (plan !== 'premium' && plan !== 'max') {
      return NextResponse.json({
        error: 'Editorial quiz is available for premium and max users only.',
        code: 'UPGRADE_REQUIRED',
      }, { status: 403 });
    }

    const { headline, source } = await req.json();

    if (!headline) {
      return NextResponse.json({ error: 'Missing headline' }, { status: 400 });
    }

    // Call DeepSeek to generate 3 GK questions
    const prompt = `You are a CLAT exam expert. Based on the following news editorial headline, create exactly 3 quick general knowledge questions that test understanding of the topic.

Each question should be:
- Relevant to CLAT Current Affairs / GK section
- Quick to answer (not complex legal reasoning)
- Multiple choice with 4 options (A, B, C, D)
- Have exactly one correct answer
- Include a brief explanation

The user has NOT read the full article — they're testing their existing knowledge about the topic. So don't test details from the article, test general awareness ABOUT the topic.

Return ONLY valid JSON (no markdown, no code fences):
{
  "questions": [
    {
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correctIndex": 0,
      "explanation": "brief explanation"
    }
  ]
}

Headline: "${headline}"
Source: ${source || 'News'}`;

    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: 'You generate CLAT GK quiz questions. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error('DeepSeek quiz error:', errText);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const deepseekData = await deepseekRes.json();
    const content = deepseekData.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let parsed: { questions: QuizQuestion[] };
    try {
      // Try direct parse
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse DeepSeek response:', content.slice(0, 500));
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
      }
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: 'AI returned no questions' }, { status: 502 });
    }

    return NextResponse.json({
      questions: parsed.questions.slice(0, 3),
      headline,
    });
  } catch (err: any) {
    console.error('Editorial quiz generate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
