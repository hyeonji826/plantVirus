import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 3000;

// CORS 허용
app.use(cors());

// 정적 파일 서비스 (HTML, CSS, JS)
app.use(express.static("test_file")); // 이 폴더 안의 파일을 클라이언트에 제공

const serviceKey = "fQlfPKnYI5jKgbG0KRQHAE1byN6vF46OBF%2FB7t4svBhp%2F3n%2BvsVBaK322v5yH%2BAJbtMYn5d80ICQgzXeIlxbcw%3D%3D";

// 중간 API 라우터
app.get("/api/weather", async (req, res) => {
  try {
    const { regionCode, tmFc } = req.query;

    const taUrl = `https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&regId=${regionCode}&tmFc=${tmFc}`;
    const landUrl = `https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&regId=${regionCode}&tmFc=${tmFc}`;

    const [taRes, landRes] = await Promise.all([
      fetch(taUrl),
      fetch(landUrl)
    ]);

    const taData = await taRes.json();
    const landData = await landRes.json();

    res.json({ taData, landData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
