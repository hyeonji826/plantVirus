// main.js 병합된 최종 예측 시스템

const serviceKey =
  "fQlfPKnYI5jKgbG0KRQHAE1byN6vF46OBF/B7t4svBhp/3n+vsVBaK322v5yH+AJbtMYn5d80ICQgzXeIlxbcw==";

// 중기예보 발표 시간: 오전 6시 or 오후 6시
function getTmFc() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = now.getHours();
  const base = h < 18 ? "0600" : "1800";
  return `${y}${m}${d}${base}`;
}

// 단기예보 기준 시간 계산
function getBaseTime() {
  const now = new Date();
  const hour = now.getHours();
  const baseHour = hour < 2 ? "2300" : `${String(Math.floor(hour / 3) * 3).padStart(2, "0") }00`;
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { baseDate: `${y}${m}${d}`, baseTime: baseHour };
}

async function predict() {
  const regionCode = document.getElementById("region").value;
  const crop = document.getElementById("crop").value;
  const resultDiv = document.getElementById("result-cards");
  resultDiv.innerHTML = "<p>데이터 불러오는 중...</p>";

  if (!regionCode || !crop) {
    alert("지역과 작물을 모두 선택해주세요.");
    return;
  }

  const tmFc = getTmFc();
  const { baseDate, baseTime } = getBaseTime();

  try {
    const [taData, landData, virusData, gridMap] = await Promise.all([
      fetch(`https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&regId=${regionCode}&tmFc=${tmFc}`).then(r => r.json()),
      fetch(`https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&regId=${regionCode}&tmFc=${tmFc}`).then(r => r.json()),
      fetch("./virus_conditions.json").then(r => r.json()),
      fetch("./region_grid_map.json").then(r => r.json()),
    ]);

    const ta = taData.response.body.items.item[0];
    const land = landData.response.body.items.item[0];
    const viruses = virusData.filter((v) => v.crop === crop);
    const { nx, ny } = gridMap[regionCode];

    // 단기예보 - 풍속, 습도
    const ultraUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=1000&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
    const ultraData = await fetch(ultraUrl).then(r => r.json());
    const shortItems = ultraData.response.body.items.item;

    const wsdList = shortItems.filter(i => i.category === "WSD").map(i => parseFloat(i.fcstValue));
    const rehList = shortItems.filter(i => i.category === "REH").map(i => parseFloat(i.fcstValue));

    let cardsHTML = "";

    viruses.forEach((virus) => {
      let matchCount = 0;

      // 기온
      const temps = [ta.taMin4, ta.taMax4, ta.taMin5, ta.taMax5, ta.taMin6, ta.taMax6, ta.taMin7, ta.taMax7].map(Number);
      const avgTemp = temps.reduce((a, b) => a + b) / temps.length;
      const tempCond = virus.conditions.temperature;
      const tempOk = (!tempCond.min || avgTemp >= tempCond.min) && (!tempCond.max || avgTemp <= tempCond.max);

      // 강수량
      const rains = [land.rnSt4Am, land.rnSt4Pm, land.rnSt5Am, land.rnSt5Pm, land.rnSt6Am, land.rnSt6Pm, land.rnSt7Am, land.rnSt7Pm].map(Number);
      const avgRain = rains.reduce((a, b) => a + b) / rains.length;
      const rainCond = virus.conditions.rainfall;
      const rainOk = !rainCond || avgRain >= (rainCond.min || 0);

      // 습도
      const avgHum = rehList.length ? rehList.reduce((a, b) => a + b) / rehList.length : 0;
      const humCond = virus.conditions.humidity;
      const humOk = humCond && (!humCond.min || avgHum >= humCond.min) && (!humCond.max || avgHum <= humCond.max);

      // 조건 일치 세 개 전부 충족 시 matchCount 증가
      if (tempOk && rainOk && humOk) matchCount = 3;
      else if ((tempOk && rainOk) || (tempOk && humOk) || (rainOk && humOk)) matchCount = 2;
      else if (tempOk || rainOk || humOk) matchCount = 1;

      // 날짜 계산
      const dateRange = (() => {
        const y = tmFc.slice(0, 4);
        const m = tmFc.slice(4, 6);
        const d = tmFc.slice(6, 8);
        const base = new Date(`${y}-${m}-${d}`);
        const s = new Date(base); s.setDate(s.getDate() + 4);
        const e = new Date(base); e.setDate(e.getDate() + 7);
        const f = d => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
        return `${f(s)} ~ ${f(e)}`;
      })();

      // 위험도 평가
      let riskLabel = "🟢 안전";
      if (matchCount >= 3) riskLabel = "🔴 위험";
      else if (matchCount === 2) riskLabel = "🟠 경계";
      else if (matchCount === 1) riskLabel = "🟡 주의";

      // 풍속 경고
      const windAlert = wsdList.filter(v => v >= 3).length >= 3;
      const strongWind = wsdList.some(v => v >= 5);
      const windWarn = windAlert || strongWind;
      const windMsg = windWarn ? `<p style="color:tomato">⚠ 풍속 ${strongWind ? "5m/s 이상" : "3m/s 이상 3일 지속"} → 인근 병해충 전파 우려</p>` : "";

      // 출력 카드
      cardsHTML += `
        <div class="card" onclick="location.href='loading.html?virus=${virus.virus}&crop=${crop}'">
          <h3>${virus.kor_name || virus.virus}</h3>
          <p><strong>예측 날짜:</strong> ${dateRange}</p>
          <p><strong>위험도:</strong> ${riskLabel}</p>
          <p><strong>전파 경로:</strong> ${virus.transmission}</p>
          ${windMsg}
        </div>
      `;
    });

    resultDiv.innerHTML = cardsHTML || "<p>예측 가능한 바이러스가 없습니다.</p>";
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<p style="color:red">오류 발생: ${err.message}</p>`;
  }
}