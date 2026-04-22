export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { base64, mediaType } = req.body;

  if (!base64) {
    return res.status(400).json({ error: "base64 데이터가 없습니다." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: mediaType || "application/pdf",
                  data: base64,
                },
              },
              {
                type: "text",
                text: `이 InBody 결과지에서 다음 수치를 추출해서 JSON으로만 응답해주세요 (단위 제외, 숫자만):
{
  "measured_date": "YYYY-MM-DD",
  "weight": 숫자,
  "body_fat_percent": 숫자,
  "muscle_mass": 숫자,
  "bmi": 숫자,
  "bmr": 숫자,
  "body_fat_mass": 숫자,
  "total_body_water": 숫자
}
없는 항목은 null로 표시. JSON만 응답, 설명 없이.`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "API 오류" });
    }

    const text = data.content?.[0]?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return res.status(200).json({ parsed });
  } catch (err) {
    console.error("파싱 오류:", err);
    return res.status(500).json({ error: err.message });
  }
}
