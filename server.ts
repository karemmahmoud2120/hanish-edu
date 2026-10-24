import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Shared Gemini client instance
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check your environment variables or Secrets panel.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. Multi-turn Gemini Chat API
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { model = 'gemini-3.1-flash-lite', systemInstruction, messages = [], prompt } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Prompt or messages are required' });
    }

    const ai = getGeminiClient();

    // Validate supported models
    const allowedModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.1-flash-lite';

    // Format chat history
    const contents: any[] = [];
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || msg.text || '' }],
      });
    }

    if (prompt) {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const config: any = {
      systemInstruction: systemInstruction || 'أنت "مستر يونس" معلم مصري ودود وخبير يشرح لطلاب منصة عائلة حنيش التعليمية بأسلوب مبسط ومشجع.',
      temperature: 0.7,
    };

    if (selectedModel === 'gemini-3.8-flash') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    let response;
    let usedModel = selectedModel;

    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config,
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${selectedModel} failed (${primaryErr.message}). Falling back to gemini-3.1-flash-lite...`);
      usedModel = 'gemini-3.1-flash-lite';
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction: systemInstruction || 'أنت "مستر يونس" معلم مصري ودود وخبير يشرح لطلاب منصة عائلة حنيش التعليمية بأسلوب مبسط ومشجع.',
          temperature: 0.7,
        },
      });
    }

    const reply = response.text || 'لم يتم استلام نص من النموذج.';
    res.json({ reply, model: usedModel });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء التواصل مع نموذج Gemini. يرجى المحاولة بعد لحظات.',
    });
  }
});

// 1.5. Real Gemini Text-To-Speech (AI Speaker) using gemini-3.8-flash-lite-tts
app.post('/api/gemini/speak', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for speech synthesis' });
    }

    // Clean text for speech
    const cleanText = text
      .replace(/[*#`_~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim()
      .slice(0, 400);

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, friendly Egyptian Arabic teacher',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('لم يتم استلام ملف الصوت من نموذج الذكاء الاصطناعي.');
    }

    const audioUrl = `data:audio/wav;base64,${base64Audio}`;
    res.json({ audioUrl, success: true });
  } catch (error: any) {
    console.error('Error in /api/gemini/speak:', error);
    res.status(500).json({
      error: error?.message || 'تعذر تشغيل المتحدث الصوتي الذكي.',
    });
  }
});

import { getProceduralSvg } from './src/utils/educationalSvgGenerator';

// 2. Educational Image Generation & Editing API (gemini-nano-banana-2.1 with AI Scientific Diagram Fallback)
app.post('/api/gemini/image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', imageSize = '1K', base64Image, mimeType = 'image/png', grade } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for image generation or editing.' });
    }

    const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const safeAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    let imageUrl = '';
    let description = '';
    let engine = 'nano-banana';

    // 1. Try Gemini Nano Banana 2.1 (for photorealistic rendering if key has quota)
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];
      if (base64Image) {
        const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        });
      }

      parts.push({
        text: prompt,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: safeAspect as any,
            imageSize: (imageSize as any) || '1K',
          },
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          } else if (part.text) {
            description += part.text + ' ';
          }
        }
      }
    } catch (nanoErr: any) {
      console.warn(`Nano-banana image generation error (${nanoErr.message}). Initiating intelligent scientific diagram synthesis fallback...`);
    }

    // 2. If nano-banana hit quota or free-tier limit: 0, synthesize AI scientific SVG using Gemini 3.1 Flash Lite
    if (!imageUrl) {
      engine = 'gemini-vector-svg';
      try {
        const ai = getGeminiClient();
        const svgPrompt = `You are an expert scientific diagram and educational illustrator for Egyptian curriculum students.
Generate a complete, valid, standalone, visually stunning SVG illustration (starting with <svg and ending with </svg>) illustrating the requested educational concept: "${prompt}".
Target grade: ${grade || 'مناهج مصرية عامة'}.
Specifications:
- Width: 800, Height: 800 (viewBox="0 0 800 800").
- Modern palette: rich gradients, drop shadows, dark/vibrant theme appropriate for textbooks.
- Clear Arabic scientific labels with font-family="system-ui, Cairo, sans-serif".
- Detailed schematic elements depicting the components clearly.
- Output ONLY the raw SVG code. No markdown fences, no backticks, no explanations.`;

        const textRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: svgPrompt,
          config: {
            temperature: 0.3,
          },
        });

        const rawSvg = textRes.text || '';
        const startIdx = rawSvg.indexOf('<svg');
        const endIdx = rawSvg.lastIndexOf('</svg>');
        if (startIdx !== -1 && endIdx !== -1) {
          const cleanSvg = rawSvg.substring(startIdx, endIdx + 6);
          const base64 = Buffer.from(cleanSvg, 'utf-8').toString('base64');
          imageUrl = `data:image/svg+xml;base64,${base64}`;
          description = `رسم بياني علمي ذكي يوضح: ${prompt}`;
        }
      } catch (svgErr: any) {
        console.warn('AI SVG synthesis error:', svgErr.message);
      }
    }

    // 3. Guaranteed instant procedural scientific SVG generator
    if (!imageUrl) {
      engine = 'procedural-svg';
      const procedural = getProceduralSvg(prompt, safeAspect);
      const base64 = Buffer.from(procedural.svg, 'utf-8').toString('base64');
      imageUrl = `data:image/svg+xml;base64,${base64}`;
      description = procedural.description;
    }

    res.json({
      imageUrl,
      description: description.trim() || `وسيلة تعليمية: ${prompt}`,
      aspectRatio: safeAspect,
      engine,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/image:', error);
    // Safe fallback so user never gets broken experience
    const procedural = getProceduralSvg(req.body?.prompt || 'رسم توضيحي للدرس', '1:1');
    const base64 = Buffer.from(procedural.svg, 'utf-8').toString('base64');
    res.json({
      imageUrl: `data:image/svg+xml;base64,${base64}`,
      description: procedural.description,
      aspectRatio: '1:1',
      engine: 'procedural-fallback',
    });
  }
});

// Helper for curated high-quality lesson cards for Egyptian curriculum fallback
function getCuratedLessonCards(topic: string, subject?: string, grade?: string) {
  const cleanTopic = topic.trim();
  return {
    summary: `شرح تفاعلي مبسط وشامل لدرس "${cleanTopic}" في مادة ${subject || 'المنهج الدراسي'} لطلاب ${grade || 'الشهادات العامة'}.`,
    cards: [
      {
        title: `المفهوم الأساسي: ${cleanTopic}`,
        text: `يعتبر درس "${cleanTopic}" من الركائز الأساسية في المنهج المصري. الفكرة الجوهرية تدور حول فهم العلاقات والقوانين المنظمة للظاهرة بدلاً من الحفظ المجرد، مع تطبيق المعطيات في نماذج عملية تشبه أسئلة كتاب الوزارة.`,
        question: `ما هي النقطة المحورية الأهم عند دراسة "${cleanTopic}"؟`,
        options: [
          'فهم القوانين والعلاقات الأساسية وتطبيقها عملياً',
          'حفظ التعريفات فقط دون ربطها بالتطبيقات',
          'تجاهل الوحدات والأمثلة التوضيحية',
        ],
        answer: 0,
        explanation: 'الفهم التحليلي وربط القوانين بالتطبيقات العملية هو المعيار الأساسي للتميز في الامتحانات الحديثة وفق نظام التقويم المصري.',
      },
      {
        title: 'التحليل الرياضي والعلمي والأمثلة التطبيقية',
        text: `عند حل أي مسألة أو سؤال في "${cleanTopic}"، نبدأ بتحديد المعطيات والمطلوب بدقة، ثم اختيار القانون أو القاعدة المناسبة، والتعويض خطوة بخطوة للوصول إلى الناتج مع ذكر التمييز أو الوحدة المناسبة.`,
        question: 'ما هي الخطوة الأولى الصحيحة للتعامل مع مسائل هذا الدرس؟',
        options: [
          'تحديد المعطيات والمطلوب وتطبيق القاعدة المناسبة خطوة بخطوة',
          'التخمين السريع للإجابة دون قراءة المسألة',
          'استخدام قوانين عشوائية غير مترابطة',
        ],
        answer: 0,
        explanation: 'تحديد المعطيات والمطلوب بدقة يضمن اختيار القانون الرياضي أو العلمي الصحيح وتفادي الأخطاء الشائعة.',
      },
      {
        title: 'خلاصة الأفكار ونصائح الامتحان والتفوق',
        text: `لضمان الدرجة النهائية في جزئية "${cleanTopic}": راجع الكلمات المفتاحية في رأس السؤال، وركز على الفروق الدقيقة التي يختبرك فيها واضع الامتحان، وتأكد من كتابة خطوات الحل بوضوح.`,
        question: 'كيف تضمن الحصول على الدرجة النهائية في هذا الموضوع؟',
        options: [
          'مراجعة الكلمات المفتاحية وكتابة خطوات الإجابة النموذجية كاملة',
          'كتابة الناتج النهائي فقط دون توضيح الخطوات',
          'عدم مراجعة الإجابة قبل تسليم ورقة الامتحان',
        ],
        answer: 0,
        explanation: 'المصحح يبحث عن خطوات الحل المنطقية والكلمات المفتاحية التي تبرهن على الاستيعاب العميق للموضوع.',
      },
    ],
  };
}

// 3. Mr. Younis Interactive Blackboard & Concept Cards Generator
app.post('/api/gemini/lesson-cards', async (req: Request, res: Response) => {
  const { subject = 'المنهج الدراسي', topic = '', grade = 'مرحلة عامة' } = req.body;
  
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const promptText = `أنت 'مستر يونس' معلم مصري خبير ومحبوب للطلاب.
قم بإعداد درس تفاعلي منظم على السبورة على هيئة 3 كروت شرح متدرجة ومترابطة للموضوع التالي: "${topic}".
المادة: ${subject}
الصف الدراسي: ${grade}

يجب أن تكون الاستجابة بصيغة JSON حصراً مطابقة تماماً للمخطط التالي:
{
  "summary": "مقدمة مشجعة في سطرين عن أهمية الدرس",
  "cards": [
    {
      "title": "عنوان الفكرة الأولى",
      "text": "شرح الفكرة بأسلوب واضح وسلس مع أمثلة واقعية تناسب الطالب المصري",
      "question": "سؤال اختيار من متعدد مباشر لقياس الفهم",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث"],
      "answer": 0,
      "explanation": "توضيح سبب صحة هذا الخيار بأسلوب مشجع"
    }
  ]
}
ملاحظة: "answer" هو فهرس (index من 0 إلى 2) للإجابة الصحيحة.`;

  try {
    const ai = getGeminiClient();
    let rawText = '';

    // Primary: gemini-3.1-flash-lite (fast and free-tier friendly)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });
      rawText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Primary flash-lite blackboard card call failed, trying gemini-3.8-flash:', primaryErr.message);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });
      rawText = response.text || '';
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : null;
    }

    if (!data || !data.cards || !Array.isArray(data.cards) || data.cards.length === 0) {
      throw new Error('Invalid JSON cards structure');
    }

    res.json(data);
  } catch (error: any) {
    console.warn('Falling back to guaranteed curated lesson cards for topic:', topic, error?.message);
    // Instant high quality fallback so user NEVER experiences a broken blackboard
    const fallbackData = getCuratedLessonCards(topic, subject, grade);
    res.json(fallbackData);
  }
});

// Development / Production Vite serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname.endsWith('dist') ? __dirname : path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
