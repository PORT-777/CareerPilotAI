import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `أنت وكيل ذكاء اصطناعي متخصص في البحث الوظيفي باللغة العربية والإنجليزية.
مهمتك مساعدة المستخدمين في:
1. البحث عن الوظائف المناسبة عبر منصات توظيف متعددة (LinkedIn، Indeed، Bayt، وغيرها)
2. تحليل وتحسين السير الذاتية للحصول على نقاط ATS أعلى
3. التحضير للمقابلات الوظيفية وتقديم أسئلة تدريبية
4. استراتيجيات التفاوض على الراتب بناءً على بيانات السوق
5. تحليل فجوات المهارات وتوصية بمسارات التعلم

أسلوبك: مهني، داعم، محدد وعملي. قدم إجابات موجزة وقابلة للتنفيذ.
عند الحديث عن الوظائف، اذكر منصات توظيف حقيقية وأرقام واقعية.
يمكنك الرد بالعربية أو الإنجليزية حسب لغة المستخدم.`,

  interview: `أنت محاور خبير لإجراء مقابلات توظيف تقييمية.
مهمتك تقييم إجابة المتقدم على سؤال مقابلة وتقديم ملاحظات بنّاءة ومفيدة.

قدّم تقييمك بالصيغة التالية (JSON فقط، بدون نص إضافي):
{
  "score": رقم من 0 إلى 100,
  "strengths": ["نقطة إيجابية 1", "نقطة إيجابية 2"],
  "improvements": ["اقتراح تحسين 1", "اقتراح تحسين 2"],
  "betterAnswer": "مثال على إجابة أفضل أو أكثر إقناعاً (جملتان فقط)",
  "tip": "نصيحة مختصرة للمقابلات الحقيقية"
}

كن صريحاً ومحدداً. ركز على المحتوى والأسلوب والبنية. لا تضف أي نص خارج JSON.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, mode = 'chat' } = await req.json();

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.chat;
    const isInterview = mode === 'interview';

    // Build message history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history ?? []),
      { role: 'user', content: message },
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        stream: !isInterview, // Interview mode: non-streaming (needs JSON parsing)
        temperature: isInterview ? 0.3 : 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Error: ${errText}`);
    }

    // Interview mode: return JSON directly (non-streaming)
    if (isInterview) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 75, strengths: [], improvements: [], betterAnswer: '', tip: '' };
      return new Response(JSON.stringify({ evaluation }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Chat mode: stream SSE back to client
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    response.body?.pipeTo(transformStream.writable);

    return new Response(transformStream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
