const serviceKey =
  "HncE4RCAL%2BTUTsv%2B1iD0HitkdYMR96i%2F2bowjyprYv80WZ%2F%2FJMD0MYIhZUiFyOH0XGk7xGYbAn1owZRNOLSzsg%3D%3D";
let cachedSubwayData = [];
let dataLoaded = false;
let lastFilteredData = [];

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
  document.getElementById("result-cards").innerText = "🟢 데이터 다 불러옴!";
  document.getElementById("loadButton").style.display = "inline-block";
}

function loadData() {
  if (!dataLoaded) {
    document.getElementById("result-cards").innerText =
      "🔴 데이터 로딩 중입니다. 잠시만 기다려주세요.";
    return;
  }

  const region = document.getElementById("region").value;
  const crop = document.getElementById("crop").value;

  const filtered = cachedSubwayData.filter(
    (item) => String(item.crop).trim() === crop.trim()
  );
  lastFilteredData = filtered;
  if (filtered.length === 0) {
    document.getElementById("result-cards").innerText =
      "해당 데이터가 없습니다.";
    return;
  }

  let html = "";
  filtered.forEach((item) => {
    html += `
      <div class="virus-card">
        <h2>${item.crop} - ${item.kor_name} (${item.virus})</h2>
        <p><strong>전염 매개체:</strong> ${item.transmission}</p>
        <p><strong>활성 시기:</strong> ${item.active_period.start} ~ ${
      item.active_period.end
    }</p>
        
        <h3>조건</h3>
        <ul>
          ${
            item.conditions.temperature
              ? `<li>온도: ${item.conditions.temperature.min}${
                  item.conditions.temperature.max
                    ? ` ~ ${item.conditions.temperature.max}`
                    : ""
                }℃</li>`
              : ""
          }
          ${
            item.conditions.humidity
              ? `<li>습도: ${item.conditions.humidity.min ?? ""}${
                  item.conditions.humidity.max
                    ? ` ~ ${item.conditions.humidity.max}`
                    : ""
                }% (${item.conditions.humidity.duration_days}일)</li>`
              : ""
          }
          ${
            item.conditions.rainfall
              ? `<li>강우량: ${item.conditions.rainfall.min}mm (${item.conditions.rainfall.duration_days}일)</li>`
              : ""
          }
          ${
            item.conditions.wind
              ? `
            <li>풍해: ${item.conditions.wind.type} (위험 기준: ${item.conditions.wind.risk_threshold} 이상 ${item.conditions.wind.duration_days}일, 고위험: ${item.conditions.wind.high_risk_threshold} 이상 ${item.conditions.wind.high_risk_duration_hours}시간)</li>
          `
              : ""
          }
        </ul>
  
        <h3>방제 정보</h3>
        <ul>
          <li><strong>약제:</strong> ${item.pesticide.products.join(", ")}</li>
          <li><strong>시기:</strong> ${item.pesticide.timing}</li>
          <li><strong>방법:</strong> ${item.pesticide.method}</li>
        </ul>
      </div>
      <hr/>
    `;
  });

  document.getElementById("result-cards").innerHTML = html;
}

// 날씨
// 위도/경도를 '기상청 좌표계'로 변환하는 함수
function dfs_xy_conv(lat, lon) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  const ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  const r = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  const x = Math.floor(r * Math.sin(theta) + XO + 0.5);
  const y = Math.floor(ro - r * Math.cos(theta) + YO + 0.5);
  return { nx: x, ny: y };
}

// 위치 정보 수신 시 좌표 변환 및 화면에 반영
function setLocation(position) {
  const { latitude, longitude } = position.coords; // 위치 객체에서 위도와 경도 추출
  const grid = dfs_xy_conv(latitude, longitude); // 위경도를 기상청 격자 좌표(nx, ny)로 변환하는 함수 호출
  document.getElementById("nx").value = grid.nx; // 변환된 nx 값을 숨겨진 입력 필드에 설정
  document.getElementById("ny").value = grid.ny; // 변환된 ny 값을 숨겨진 입력 필드에 설정
}

// 위치 정보 요청 실패 시 오류 처리
function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert("위치 정보 사용이 거부되었습니다.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("위치 정보를 사용할 수 없습니다.");
      break;
    case error.TIMEOUT:
      alert("위치 정보를 가져오는 데 시간이 초과되었습니다.");
      break;
    default:
      alert("알 수 없는 오류가 발생했습니다.");
  }
}

// 위치 정보 요청 및 설정 - Geolocation API 사용 | getCurrentPosition : 현재 위치를 1회 가져올 때 사용
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setLocation, showError); // watchPosition -- setLocation showError 따로 구현해서 처리
  } else {
    alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
  }
}

// 날씨 데이터 조회 및 화면 출력 함수
function fetchData() {
  // 입력 필드에서 사용자가 선택하거나 자동 설정된 값을 가져옴
  const baseDate = document.getElementById("base_date").value.replace(/-/g, ""); // 'YYYY-MM-DD' 형식을 'YYYYMMDD'로 변환
  const baseTime = document.getElementById("base_time").value; // 기준 시간 (예: '0500', '0800' 등)
  const nx = document.getElementById("nx").value; // 격자 X좌표 (위도 기반)
  const ny = document.getElementById("ny").value; // 격자 Y좌표 (경도 기반)

  // 입력값 유효성 확인
  if (!baseDate || !nx || !ny) {
    // 인풋 중 값이 한개라도 비면
    alert("모든 값을 입력해주세요.");
    return;
  }

  // 기상청 API로 URL 생성
  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?` +
    `serviceKey=${serviceKey}` +
    `&base_date=${baseDate}&base_time=${baseTime}` +
    `&nx=${nx}&ny=${ny}&numOfRows=1000&dataType=JSON`;
  console.log(url);
  // API 요청
  fetch(url) // 생성된 URL 로 데이터 요청
    .then((response) => response.json()) // fetch에서 응답 받고 실행 -> response : 전체 응답 객체 | .json() 응답 받은 객체를 JSON 데이터로 변환
    .then((data) => {
      // 변환된 데이터를 가지고 작업
      /* 조건식
			!data.response
			→ response가 아예 없으면 (응답이 없거나 null이면)
			!data.response.body
			→ response는 있지만 그 안에 body가 없으면 (잘못된 구조일 경우)
			!data.response.body.items
			→ body는 있지만 진짜 날씨 데이터(items)가 없으면

			이 중 하나라도 true 라면 데이터 없다고 판단해서 실행
			*/
      if (!data.response || !data.response.body || !data.response.body.items) {
        document.getElementById("errorMessage").textContent =
          "데이터가 없습니다.";
        document.getElementById("errorMessage").style.display = "block"; // 에러 나타내기
        document.getElementById("responseData").innerHTML = ""; // 이전 데이터 제거
        document.getElementById("result").style.display = "none"; // 결과 숨기기
        return;
      }
      // 전체 흐름은 API에서 받아온 날씨 데이터를 필터링 후 가공
      const items = data.response.body.items.item; // 데이터가 시간대별로 추가
      const filtered = items.filter((item) => item.fcstDate === baseDate); // 그중에서 선택한 날짜(baseDate) 와 같은 데이터만 찾음. 즉, 오늘 날짜에 해당하는 예보만 필터링링
      const formatted = formatWeatherData(filtered, baseDate, baseTime); // 필터링된 데이터들을 formatWeatherData() 함수로 넘겨서 알기 쉬운 정보로 데이터 변환
      document.getElementById("responseData").innerHTML = formatted; // 변환된 HTML을 페이지 리스트에 넣어줌. (ul > li로 추가됨)
      document.getElementById("result").style.display = "block";
      document.getElementById("errorMessage").textContent = ""; // 에러가 아닌 정상 호출 되면 에러텍스트 지우기
      document.getElementById("errorMessage").style.display = "none"; // 에러 메세지 숨기기
    })
    .catch((error) => {
      // .then 에서 에러가 나면 실행 (네트워크 문제, API 호출 실패 등)
      console.error("API 호출 오류:", error); // 디버깅 용도
      document.getElementById(
        "errorMessage"
      ).textContent = `오류가 발생했습니다: ${
        error.message || "네트워크 또는 서버 문제"
      }`;
      document.getElementById("errorMessage").style.display = "block"; // 에러 나타내기
      document.getElementById("responseData").innerHTML = ""; // 이전 데이터 제거
      document.getElementById("result").style.display = "none"; // 결과 숨기기
    });
}

// 날씨 데이터를 사람이 읽기 쉬운 형태로 정리
function formatWeatherData(data, baseDate, baseTime) {
  // 기상 코드 매핑
  const map = {
    TMP: "기온(°C)",
    SKY: "하늘 상태",
    PTY: "강수 형태",
    PCP: "강수량(mm)",
    WSD: "풍속(m/s)",
    UUU: "동서 바람 성분(m/s)",
    VVV: "남북 바람 성분(m/s)",
    WAV: "파고(m)",
    REH: "습도(%)",
    VEC: "풍향(°)",
    POP: "강수확률(%)",
    SNO: "적설(cm)",
  };
  // 하늘 상태 코드
  const skyMap = {
    1: "맑음",
    3: "구름 많음",
    4: "흐림",
  };
  // 하늘 상태 이모지
  const skyEmojiMap = {
    1: "☀️",
    3: "⛅",
    4: "☁️",
  };
  // 강수 형태 코드
  const ptyMap = {
    0: "없음",
    1: "비",
    2: "비/눈",
    3: "눈",
    4: "소나기",
  };
  // 강수 상태 이모지
  const ptyEmojiMap = {
    1: "🌧️", // 비
    2: "🌨️", // 비/눈
    3: "❄️", // 눈
    4: "🌦️", // 소나기
  };

  // 시간별 데이터 그룹화
  const grouped = {};
  data.forEach((item) => {
    if (!item.fcstTime) return; // 시간 정보가 없으면 건너뜀
    if (!grouped[item.fcstTime]) grouped[item.fcstTime] = []; // 해당 시간대가 없으면 배열로 초기화
    grouped[item.fcstTime].push(item); // 해당 시간대 배열에 데이터를 추가
  });

  // 첫 시간대의 하늘 상태 요약 (#skySummary 상태)
  let firstSummary = null; // 첫 시간대의 하늘 상태나 강수 상태 요약을 담을 변수
  const sortedTimes = Object.keys(grouped).sort(); // 시간대 키를 정렬하여 시간순으로 정렬된 배열 생성
  if (sortedTimes.length > 0) {
    // 시간이 하나라도 있을 경우 실행
    const firstTime = sortedTimes[0]; // 가장 이른 시간대 선택
    const items = grouped[firstTime]; // 해당 시간대에 해당하는 데이터들

    const ptyItem = items.find((i) => i.category === "PTY"); // 강수 형태 항목 찾기
    const skyItem = items.find((i) => i.category === "SKY"); // 하늘 상태 항목 찾기

    const ptyValue = ptyItem?.fcstValue || "0"; // 강수 형태 값 (없으면 "0"으로 처리)
    const skyValue = skyItem?.fcstValue; // 하늘 상태 값

    if (ptyValue !== "0") {
      // 비나 눈이 오는 경우
      const ptyDesc = ptyMap[ptyValue] || ptyValue; // 강수 설명 텍스트
      const emoji = ptyEmojiMap[ptyValue] || "🌧️"; // 강수 이모지 (기본값은 비)
      firstSummary = `${emoji} 강수 상태: ${ptyDesc}`; // 요약 문구 생성
    } else if (skyValue) {
      // 강수 없고 하늘 상태가 있는 경우 (PKY-0 취급 X)
      const emoji = skyEmojiMap[skyValue] || ""; // 하늘 상태 이모지
      const skyDesc = skyMap[skyValue] || skyValue; // 하늘 상태 설명
      firstSummary = `${emoji} 하늘 상태: ${skyDesc}`; // 요약 문구 생성
    }
  }

  if (firstSummary) {
    // 요약 텍스트가 존재할 경우에만 실행
    const skyElem = document.getElementById("skySummary"); // 하늘 상태 요약을 표시할 요소 가져오기
    if (skyElem) {
      skyElem.textContent = firstSummary; // 요소가 존재하면 요소에 요약 텍스트 삽입
    }
  }

  // 리스트 출력 HTML 구성
  let result = ""; // 다음 조회를 위해 최종 HTML 문자열 초기화
  for (const time of sortedTimes) {
    // 정렬된 시간별로 반복
    const items = grouped[time]; // 해당 시간의 예보 항목들 가져오기
    if (!items) continue; // 항목이 없으면 건너뜀

    const skyItem = items.find((item) => item.category === "SKY"); // 하늘 상태 항목 찾기
    const ptyItem = items.find((item) => item.category === "PTY"); // 강수 형태 항목 찾기

    const skyValue = skyItem?.fcstValue; // 하늘 상태 값 추출
    const ptyValue = ptyItem?.fcstValue; // 강수 형태 값 추출

    const skyClass = skyValue ? `sky-${skyValue}` : ""; // 하늘 상태에 따른 클래스 설정
    const ptyClass = ptyValue && ptyValue !== "0" ? `pty-${ptyValue}` : ""; // 강수 있을 경우 클래스 설정

    const liClass = ["data-list", skyClass, ptyClass].filter(Boolean).join(" "); // 클래스들을 공백으로 연결

    result += `<li class="${liClass}"><h3>${time.slice(
      0,
      2
    )}:00</h3><span class="sky-info"></span><ul>`; // 시간 제목 + 날씨 정보 컨테이너 시작

    // 항목별 상세 정보 나열
    items.forEach((item) => {
      let value = item.fcstValue; // 예보 값
      if (item.category === "SKY") value = skyMap[value] || value; // 하늘 상태 변환
      if (item.category === "PTY") value = ptyMap[value] || value; // 강수 형태 변환
      const label = map[item.category] || item.category; // 항목 이름 변환
      result += `<li>${label}: ${value}</li>`; // 리스트 항목 추가
    });
    result += `</ul></li>`; // 항목 닫기
  }

  return result; // 완성된 HTML 반환
}

// 현재 시각 기준으로 자동 날짜/시간 설정
function setDefaultDateTime() {
  const now = new Date(); // 현재 시각 객체 생성
  now.setMinutes(now.getMinutes() - 30); // API 기준 시간보다 30분 이전으로 보정 (예보 생성 시간 기준)

  const year = now.getFullYear(); // 연도 추출
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 월 추출 (0부터 시작하므로 +1), 두 자리로 패딩
  const date = String(now.getDate()).padStart(2, "0"); // 일 추출, 두 자리로 패딩
  const baseDate = `${year}${month}${date}`; // yyyyMMdd 형식으로 조합

  const hour = now.getHours(); // 시(hour) 추출
  const availableTimes = [2, 5, 8, 11, 14, 17, 20, 23]; // 기상청 예보 조회 가능 시간 목록
  let closestTime = availableTimes[0]; // 기본값: 가장 첫 시간으로 초기화

  // 현재 시간과 가장 가까운 예보 시간(baseTime)을 선택
  for (let i = 1; i < availableTimes.length; i++) {
    // 현재 시간(hour)과 각 예보 시간의 차이를 비교
    if (Math.abs(hour - availableTimes[i]) < Math.abs(hour - closestTime)) {
      closestTime = availableTimes[i]; // 더 가까운 예보 시간을 closestTime으로 설정
    }
    // 기상청 동네예보 API는 정해진 특정 시간(예: 02, 05, 08, 11시 등) 기준으로 데이터가 제공되기 때문에,
    // 사용자의 현재 시각과 가장 가까운 예보 시간을 자동으로 계산해서 그에 맞는 baseTime을 지정
  }

  const baseTime = String(closestTime).padStart(2, "0") + "00"; // 두 자리 시 + "00" 형식으로 baseTime 구성 (ex. "1400")

  document.getElementById("base_date").value = baseDate; // 날짜 입력 필드에 자동 설정

  const timeSelect = document.getElementById("base_time"); // 시간 select 요소 가져오기
  if (timeSelect) {
    timeSelect.value = baseTime; // select 요소에서 가까운 시간으로 선택 설정
  }
}

// window
window.onload = function () {
  getLocation(); // 위치 정보
  setDefaultDateTime(); // 날짜/시간
  fetchAllData();
  console.log("fetchAllData 실행됨");
};
