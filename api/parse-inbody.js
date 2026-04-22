export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { base64, mediaType, ageGroup } = req.body;

  if (!base64) {
    return res.status(400).json({ error: "base64 데이터가 없습니다." });
  }

  const ageLabel = ageGroup === "child" ? "아동용" : "성인용";

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
        temperature: 0,
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
                text: `이 문서는 InBody J50 (${ageLabel}) 체성분 분석기의 결과지입니다.

아래 항목들을 결과지에서 정확하게 찾아 숫자만 추출해주세요.
각 항목명 옆 또는 아래에 표시된 숫자값을 읽어주세요. 단위(kg, %, kcal 등)는 제외하고 숫자만 입력하세요.

추출 항목:
- 측정일시: 결과지 상단의 날짜 (YYYY-MM-DD 형식으로 변환)
- 신장: "신장" 항목의 숫자 (cm)
- 체중: "체중" 항목의 숫자 (kg)
- 체지방률: "체지방률" 또는 "체지방율" 항목의 숫자 (%)
- 골격근량: "골격근량" 항목의 숫자 (kg)
- BMI: "BMI" 항목의 숫자
- 기초대사량: "기초대사량" 또는 "BMR" 항목의 숫자 (kcal)
- 체지방량: "체지방량" 항목의 숫자 (kg)
- 체수분: "체수분" 항목의 숫자 (L)

반드시 아래 JSON 형식으로만 응답하세요. 설명, 주석, 마크다운 없이 JSON만 출력하세요:
{
  "measured_date": "YYYY-MM-DD",
  "height": 숫자 또는 null,
  "weight": 숫자 또는 null,
  "body_fat_percent": 숫자 또는 null,
  "muscle_mass": 숫자 또는 null,
  "bmi": 숫자 또는 null,
  "bmr": 숫자 또는 null,
  "body_fat_mass": 숫자 또는 null,
  "total_body_water": 숫자 또는 null
}`,
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

