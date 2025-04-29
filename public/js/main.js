const serviceKey =
  "HncE4RCAL%2BTUTsv%2B1iD0HitkdYMR96i%2F2bowjyprYv80WZ%2F%2FJMD0MYIhZUiFyOH0XGk7xGYbAn1owZRNOLSzsg%3D%3D";
let cachedSubwayData = [];
let dataLoaded = false;
window.addEventListener("load", fetchAllData);

async function fetchAllData() {
  document.getElementById("result-cards").innerText =
    "🔴 데이터 불러오는 중입니다...";
  document.getElementById("loadButton").style.display = "none";

  try {
    const virusResponse = await fetch(`/plants/virus/`);
    if (!virusResponse.ok) {
      throw new Error(`바이러스 데이터를 불러오지 못했습니다.`);
    }
    const viruses = await virusResponse.json();
    cachedSubwayData = viruses;
    console.log(`페이지 로드 완료`, viruses);
  } catch (err) {
    console.error(`페이지 로드 실패`, err);
  }
  dataLoaded = true;
  console.log(viruses);
  document.getElementById("subwayInfo").innerText = "🟢 데이터 다 불러옴!";
  document.getElementById("loadButton").style.display = "inline-block";
}

window.onload = function () {
  fetchAllData();
  console.log("fetchAllData 실행됨");
};

/*
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
*/
