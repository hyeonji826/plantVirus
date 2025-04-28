// main.js 예측 시스템(Only 중기)

const serviceKey =
  "fQlPfKnYI5jKgbG0K0RQHAE1byN6vF46OBF%2FB7t4svBhp%2F3n%2BvsVBaK322v5yH%2BAJbtMYn5d80ICQgzXellxbcw%3D%3D";

// 중기예보 기준 시간
function getTmFc() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = now.getHours();
  const base = h < 18 ? "0600" : "1800";
  return `${y}${m}${d}${base}`;
}

async function predict() {
  const regionCode = document.getElementById("region").value;
  const crop = document.getElementById("crop").value;
  const resultDiv = document.getElementById("result-cards");
  resultDiv.innerHTML = "<p>데이터 불러오는 중...</p>";
  const baseUrl = "https://apis.data.go.kr/1360000/MidFcstInfoService";

  if (!regionCode || !crop) {
    alert("지역과 작물을 모두 선택해주세요.");
    return;
  }

  const tmFc = getTmFc();

  try {
    const weatherResponse = await fetch(
      `/api/weather?regionCode=${regionCode}&tmFc=${tmFc}`
    );
    const weatherData = await weatherResponse.json();

    const virusData = await fetch("/virus_conditions.json").then((r) =>
      r.json()
    );

    const ta = weatherData.taData.response.body.items.item[0];
    const land = weatherData.landData.response.body.items.item[0];

    // 바이러스 데이터 확인해보기
    console.log(virusData);

    const viruses = virusData.filter((v) => v.crop === crop);

    let cardsHTML = "";

    viruses.forEach((virus) => {
      let matchCount = 0;

      // 기온 평균
      const temps = [
        ta.taMin4,
        ta.taMax4,
        ta.taMin5,
        ta.taMax5,
        ta.taMin6,
        ta.taMax6,
        ta.taMin7,
        ta.taMax7,
      ].map(Number);
      const avgTemp = temps.reduce((a, b) => a + b) / temps.length;
      const tempCond = virus.conditions.temperature;
      const tempOk =
        (!tempCond.min || avgTemp >= tempCond.min) &&
        (!tempCond.max || avgTemp <= tempCond.max);

      // 강수량 평균
      const rains = [
        land.rnSt4Am,
        land.rnSt4Pm,
        land.rnSt5Am,
        land.rnSt5Pm,
        land.rnSt6Am,
        land.rnSt6Pm,
        land.rnSt7Am,
        land.rnSt7Pm,
      ].map(Number);
      const avgRain = rains.reduce((a, b) => a + b) / rains.length;
      const rainCond = virus.conditions.rainfall;
      const rainOk = !rainCond || avgRain >= (rainCond.min || 0);

      if (tempOk && rainOk) matchCount = 2;
      else if (tempOk || rainOk) matchCount = 1;

      // 날짜 범위
      const dateRange = (() => {
        const y = tmFc.slice(0, 4);
        const m = tmFc.slice(4, 6);
        const d = tmFc.slice(6, 8);
        const base = new Date(`${y}-${m}-${d}`);
        const s = new Date(base);
        s.setDate(s.getDate() + 4);
        const e = new Date(base);
        e.setDate(e.getDate() + 7);
        const f = (d) =>
          `${d.getFullYear()} ${d.getMonth() + 1} ${d.getDate()}`;
        return `${f(s)} ~ ${f(e)}`;
      })();

      // 위험도 판단
      let riskLabel = "🟢 안전";
      if (matchCount >= 2) riskLabel = "🔴 위험";
      else if (matchCount === 1) riskLabel = "🟠 경계";
      else riskLabel = "🟡 주의";

      // 카드 출력
      cardsHTML += `
        <div class="card" onclick="location.href='loading.html?virus=${
          virus.virus
        }&crop=${crop}'">
          <h3>${virus.kor_name || virus.virus}</h3>
          <p><strong>예측 날짜:</strong> ${dateRange}</p>
          <p><strong>위험도:</strong> ${riskLabel}</p>
        </div>
      `;
    });

    resultDiv.innerHTML =
      cardsHTML || "<p>예측 가능한 바이러스가 없습니다.</p>";
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<p style="color:red">오류 발생: ${err.message}</p>`;
  }
}
