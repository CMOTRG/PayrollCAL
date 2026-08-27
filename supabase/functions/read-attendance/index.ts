// Supabase Edge Function: read-attendance
// รับรูปภาพ/PDF ตารางลงเวลา ส่งต่อไปยัง Google Gemini API โดยเก็บ GOOGLE_API_KEY ไว้ฝั่งเซิร์ฟเวอร์เท่านั้น
// deploy: supabase functions deploy read-attendance
// ตั้งค่า secret ก่อน deploy: supabase secrets set GOOGLE_API_KEY=AIzaSy-xxxx
// (ขอ API key ได้ฟรีที่ https://aistudio.google.com/apikey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// เปลี่ยนชื่อโมเดลตรงนี้ได้ถ้า Google ออกรุ่นใหม่กว่านี้ — เช็กรุ่นล่าสุดได้ที่ https://ai.google.dev/gemini-api/docs/models
const MODEL = "gemini-2.0-flash";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mimeType, data, prompt } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
