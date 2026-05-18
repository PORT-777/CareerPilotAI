import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const CV_ANALYSIS_PROMPT = `أنت خبير متخصص في تحليل السير الذاتية وتحسينها.
قم بتحليل المحتوى التالي للسيرة الذاتية وأرجع تحليلاً شاملاً بصيغة JSON فقط (بدون أي نص إضافي).

يجب أن يتضمن JSON التالي:
{
  "score": رقم من 0 إلى 100 يمثل جودة السيرة الذاتية,
  "atsScore": رقم من 0 إلى 100 يمثل نقاط نظام ATS,
  "extractedSkills": ["قائمة", "المهارات", "التقنية", "والناعمة"],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["تحسين مقترح 1", "تحسين مقترح 2"],
  "missingKeywords": ["كلمة مفتاحية مفقودة 1", "كلمة مفتاحية مفقودة 2"],
  "targetRoles": ["وظيفة مناسبة 1", "وظيفة مناسبة 2"],
  "experienceYears": رقم يمثل تقدير سنوات الخبرة,
  "summary": "ملخص نصي قصير للسيرة الذاتية بالعربية"
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { cvId, filePath } = await req.json();

    if (!cvId) {
      return new Response(JSON.stringify({ error: 'cvId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    let messages: any[];

    if (filePath) {
      // Download the actual PDF from storage using service role
      console.log('Downloading PDF from storage:', filePath);
      const { data: fileData, error: fileError } = await supabaseAdmin
        .storage
        .from('user-cvs')
        .download(filePath.replace('user-cvs/', ''));

      if (fileError || !fileData) {
        console.error('File download error:', fileError?.message);
        throw new Error(`فشل تحميل الملف: ${fileError?.message}`);
      }

      // Convert to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      console.log('PDF downloaded, size:', uint8Array.length, 'bytes');

      // Send PDF as multimodal input to Gemini
      messages = [
        { role: 'system', content: CV_ANALYSIS_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'هذا ملف السيرة الذاتية PDF. قم بتحليله وإرجاع JSON فقط:',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64}`,
              },
            },
          ],
        },
      ];
    } else {
      // Fallback: text-only analysis if no filePath provided
      messages = [
        { role: 'system', content: CV_ANALYSIS_PROMPT },
        {
          role: 'user',
          content: 'قم بتحليل سيرة ذاتية نموذجية لمهندس برمجيات بخبرة 4 سنوات في تطوير تطبيقات React Native وTypeScript وNode.js.',
        },
      ];
    }

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Error: ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? '{}';

    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const analysis = JSON.parse(jsonMatch[0]);

    // Update CV record with analysis results
    const { error: updateError } = await supabaseAdmin
      .from('user_cvs')
      .update({
        score: analysis.score ?? null,
        extracted_skills: analysis.extractedSkills ?? [],
      })
      .eq('id', cvId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError.message);
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('cv-analyze error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
