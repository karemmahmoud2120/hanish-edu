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

const decodeXmlText = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();

const getPublicYouTubeFeed = async (channelId: string) => {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
  if (!response.ok) {
    console.error('فشل طلب خلاصة قناة YouTube العامة.', response.status);
    return null;
  }
  const xml = await response.text();
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, entry]) => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1];
    const thumbnail = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1];
    if (!videoId || !title) return [];
    return [{
      videoId: decodeXmlText(videoId),
      title: decodeXmlText(title),
      description: description ? decodeXmlText(description) : '',
      publishedAt: publishedAt ? decodeXmlText(publishedAt) : '',
      thumbnail: thumbnail ? decodeXmlText(thumbnail) : `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    }];
  });
  return videos;
};

app.post('/api/youtube/channel-videos', async (req: Request, res: Response) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = req.body?.channelId;
  const pageToken = req.body?.pageToken;
  const maxResults = Number(req.body?.maxResults ?? 50);

  if (typeof channelId !== 'string' || !/^UC[\w-]{22}$/.test(channelId)) {
    return res.status(400).json({ error: 'أدخل معرف قناة YouTube صالحًا يبدأ بـ UC.' });
  }
  if (pageToken !== undefined && (typeof pageToken !== 'string' || pageToken.length > 2048)) {
    return res.status(400).json({ error: 'رمز صفحة فيديوهات YouTube غير صالح.' });
  }

  try {
    if (!apiKey) {
      if (pageToken) {
        return res.status(400).json({ error: 'تم تحميل أحدث فيديوهات القناة فقط. أضف YOUTUBE_API_KEY لتحميل صفحات أقدم.' });
      }
      const videos = await getPublicYouTubeFeed(channelId);
      if (!videos) {
        return res.status(502).json({ error: 'تعذر قراءة خلاصة القناة العامة. تحقق من معرف القناة وحاول مرة أخرى.' });
      }
      return res.json({ videos, nextPageToken: null, source: 'public-feed' });
    }

    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelUrl.searchParams.set('part', 'contentDetails');
    channelUrl.searchParams.set('id', channelId);
    channelUrl.searchParams.set('key', apiKey);
    const channelResponse = await fetch(channelUrl);
    if (!channelResponse.ok) {
      console.error('فشل طلب بيانات قناة YouTube.', channelResponse.status);
      return res.status(502).json({ error: 'تعذر قراءة القناة. تحقق من المعرف ومفتاح YouTube API.' });
    }
    const channelData = await channelResponse.json() as {
      items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
    };
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return res.status(404).json({ error: 'لم يتم العثور على قناة عامة بهذا المعرف أو لا تحتوي على فيديوهات.' });
    }

    const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    playlistUrl.searchParams.set('part', 'snippet,contentDetails');
    playlistUrl.searchParams.set('playlistId', uploadsPlaylistId);
    playlistUrl.searchParams.set('maxResults', String(Number.isInteger(maxResults) ? Math.min(Math.max(maxResults, 1), 50) : 50));
    playlistUrl.searchParams.set('key', apiKey);
    if (pageToken) playlistUrl.searchParams.set('pageToken', pageToken);

    const playlistResponse = await fetch(playlistUrl);
    if (!playlistResponse.ok) {
      console.error('فشل طلب فيديوهات قناة YouTube.', playlistResponse.status);
      return res.status(502).json({ error: 'تعذر جلب فيديوهات القناة. تحقق من صلاحية المفتاح وحصة YouTube API.' });
    }
    const playlistData = await playlistResponse.json() as {
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          publishedAt?: string;
          thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
          resourceId?: { videoId?: string };
        };
        contentDetails?: { videoId?: string };
      }>;
    };
    const videos = (playlistData.items || []).flatMap((item) => {
      const snippet = item.snippet;
      const videoId = item.contentDetails?.videoId || snippet?.resourceId?.videoId;
      if (!snippet || !videoId || !snippet.title) return [];
      return [{
        videoId,
        title: snippet.title,
        description: snippet.description || '',
        publishedAt: snippet.publishedAt || '',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      }];
    });

    return res.json({ videos, nextPageToken: playlistData.nextPageToken || null, source: 'youtube-api' });
  } catch (error) {
    console.error('تعذر الاتصال بخدمة YouTube Data API.', error);
    return res.status(502).json({ error: 'تعذر الاتصال بخدمة YouTube. حاول مرة أخرى.' });
  }
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const accessToken = req.body?.accessToken;
  if (!clientId) return res.status(503).json({ error: 'تسجيل Google غير مُعد على الخادم.' });
  if (typeof accessToken !== 'string' || accessToken.length < 20) {
    return res.status(400).json({ error: 'رمز تسجيل Google غير صالح.' });
  }

  try {
    const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!tokenInfoResponse.ok) return res.status(401).json({ error: 'انتهت صلاحية جلسة Google أو أن الرمز غير صالح.' });
    const tokenInfo = await tokenInfoResponse.json() as { issued_to?: string; aud?: string };
    if ((tokenInfo.issued_to || tokenInfo.aud) !== clientId) {
      return res.status(401).json({ error: 'رمز Google لم يصدر لتطبيق المنصة.' });
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) return res.status(401).json({ error: 'تعذر التحقق من ملف Google الشخصي.' });
    const profile = await profileResponse.json() as {
      sub?: string;
      name?: string;
      email?: string;
      email_verified?: boolean;
      picture?: string;
    };
    if (!profile.sub || !profile.name || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ error: 'يجب استخدام حساب Google ببريد إلكتروني موثّق.' });
    }
    return res.json({ id: profile.sub, name: profile.name, email: profile.email, avatar: profile.picture });
  } catch (error) {
    console.error('تعذر التحقق من تسجيل Google.', error);
    return res.status(502).json({ error: 'تعذر الاتصال بخدمة التحقق من Google. حاول مرة أخرى.' });
  }
});

app.post('/api/auth/facebook', async (req: Request, res: Response) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const accessToken = req.body?.accessToken;
  if (!appId || !appSecret) return res.status(503).json({ error: 'تسجيل Facebook غير مُعد على الخادم.' });
  if (typeof accessToken !== 'string' || accessToken.length < 20) {
    return res.status(400).json({ error: 'رمز تسجيل Facebook غير صالح.' });
  }

  try {
    const appAccessToken = `${appId}|${appSecret}`;
    const debugUrl = new URL('https://graph.facebook.com/v21.0/debug_token');
    debugUrl.searchParams.set('input_token', accessToken);
    debugUrl.searchParams.set('access_token', appAccessToken);
    const debugResponse = await fetch(debugUrl);
    if (!debugResponse.ok) return res.status(401).json({ error: 'تعذر التحقق من رمز Facebook.' });
    const debugResult = await debugResponse.json() as {
      data?: { app_id?: string; is_valid?: boolean; user_id?: string };
    };
    const tokenData = debugResult.data;
    if (!tokenData?.is_valid || tokenData.app_id !== appId || !tokenData.user_id) {
      return res.status(401).json({ error: 'رمز Facebook غير صالح لهذا التطبيق.' });
    }

    const profileUrl = new URL('https://graph.facebook.com/v21.0/me');
    profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    profileUrl.searchParams.set('access_token', accessToken);
    const profileResponse = await fetch(profileUrl);
    if (!profileResponse.ok) return res.status(401).json({ error: 'تعذر التحقق من ملف Facebook الشخصي.' });
    const profile = await profileResponse.json() as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };
    if (profile.id !== tokenData.user_id || !profile.name || !profile.email) {
      return res.status(401).json({ error: 'يجب منح إذن البريد الإلكتروني لحساب Facebook.' });
    }
    return res.json({ id: profile.id, name: profile.name, email: profile.email, avatar: profile.picture?.data?.url });
  } catch (error) {
    console.error('تعذر التحقق من تسجيل Facebook.', error);
    return res.status(502).json({ error: 'تعذر الاتصال بخدمة التحقق من Facebook. حاول مرة أخرى.' });
  }
});

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

// 3. Mr. Younis Interactive Blackboard & Concept Cards Generator
app.post('/api/gemini/lesson-cards', async (req: Request, res: Response) => {
  const { subject = 'المنهج الدراسي', topic = '', grade = 'مرحلة عامة' } = req.body;

  if (typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required.' });
  }
  if (topic.length > 500) {
    return res.status(400).json({ error: 'السؤال طويل جدًا. اختصره إلى 500 حرف أو أقل.' });
  }

  try {
    const ai = getGeminiClient();
    const promptText = `أنت "مستر يونس"، معلم مصري يجيب الطالب بلغة عربية سهلة ودقيقة.
أجب عن سؤال الطالب اعتمادًا على بحث Google الحالي ومصادر رسمية أو تعليمية موثوقة فقط، مثل مواقع الوزارات والجامعات والهيئات العلمية والمنظمات الدولية. لا تستخدم المدونات أو المنتديات أو منشورات التواصل الاجتماعي. لا تخترع حقائق أو مراجع، وإذا لم تجد مصادر كافية فقل ذلك بوضوح في حقل summary واجعل cards مصفوفة فارغة.
سؤال الطالب: "${topic.trim()}"
المادة إن وُجدت: ${typeof subject === 'string' ? subject.slice(0, 100) : 'غير محددة'}
الصف الدراسي: ${typeof grade === 'string' ? grade.slice(0, 100) : 'غير محدد'}

أعد JSON فقط، دون Markdown، بهذا الشكل:
{
  "summary": "إجابة مباشرة وواضحة عن سؤال الطالب، مبنية على نتائج البحث",
  "cards": [
    {
      "title": "الفكرة أو الحقيقة الأولى",
      "text": "شرح موثق للمعلومة بأسلوب مناسب للصف",
      "question": "سؤال قصير للتحقق من الفهم",
      "options": ["اختيار صحيح", "اختيار خاطئ", "اختيار خاطئ"],
      "answer": 0,
      "explanation": "توضيح الإجابة الصحيحة اعتمادًا على المعلومة الموثقة"
    }
  ]
}
أنشئ من بطاقة إلى ثلاث بطاقات فقط عندما تدعمها المصادر. answer فهرس من 0 إلى 2. لا تضع روابط داخل JSON؛ سيعرض التطبيق المراجع التي أعادها البحث منفصلة.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });
    const candidate = response.candidates?.[0];
    const rawText = response.text || '';
    const webSources = (candidate?.groundingMetadata?.groundingChunks || [])
      .flatMap((chunk) => chunk.web?.uri ? [{ title: chunk.web.title || chunk.web.domain || 'مصدر تعليمي', url: chunk.web.uri }] : []);
    const trustedSources = [...new Map(webSources.filter((source) => {
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:') return false;
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        return host.endsWith('.gov') ||
          host.endsWith('.edu') ||
          host.endsWith('.gov.eg') ||
          host.endsWith('.edu.eg') ||
          host.endsWith('.ac.uk') ||
          host.endsWith('.int') ||
          host === 'unesco.org' ||
          host.endsWith('.unesco.org') ||
          host === 'un.org' ||
          host.endsWith('.un.org');
      } catch {
        return false;
      }
    }).map((source) => [source.url, source])).values()];

    if (trustedSources.length === 0) {
      return res.status(502).json({
        error: 'لم يعثر البحث على مرجع رسمي أو تعليمي موثوق لهذا السؤال. جرّب صياغة السؤال بشكل أوضح.',
      });
    }

    let data: { summary?: unknown; cards?: unknown };
    try {
      data = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : null;
    }

    if (
      !data ||
      typeof data.summary !== 'string' ||
      !Array.isArray(data.cards) ||
      data.cards.length === 0 ||
      data.cards.length > 3 ||
      data.cards.some((card) =>
        !card ||
        typeof card.title !== 'string' ||
        typeof card.text !== 'string' ||
        typeof card.question !== 'string' ||
        !Array.isArray(card.options) ||
        card.options.length !== 3 ||
        !card.options.every((option: unknown) => typeof option === 'string') ||
        !Number.isInteger(card.answer) ||
        card.answer < 0 ||
        card.answer > 2 ||
        typeof card.explanation !== 'string'
      )
    ) {
      return res.status(502).json({
        error: 'تعذر إعداد إجابة تعليمية موثقة من نتائج البحث. أعد صياغة السؤال وحاول مرة أخرى.',
      });
    }

    return res.json({ ...data, sources: trustedSources, grounded: true });
  } catch (error) {
    console.error('تعذر إنشاء إجابة السبورة بالاعتماد على بحث Google.', error);
    return res.status(502).json({
      error: 'تعذر البحث في المصادر التعليمية الآن. تحقق من اتصال الخادم وإعداد GEMINI_API_KEY ثم حاول مرة أخرى.',
    });
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
