function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      crop: params.get("crop"),
      virus: params.get("virus")
    };
  }
  
  async function loadVirusInfo() {
    const { crop, virus } = getQueryParams();
    const data = await fetch("./virus_conditions.json").then(r => r.json());
    const target = data.find(v => v.crop === crop && v.virus === virus);
  
    if (!target) {
      document.getElementById("virus-title").textContent = "데이터를 찾을 수 없습니다.";
      return;
    }
  
    document.getElementById("crop").textContent = target.crop;
    document.getElementById("kor_name").textContent = target.kor_name || "-";
    document.getElementById("products").textContent = target.pesticide?.products?.join(", ") || "-";
    document.getElementById("timing").textContent = target.pesticide?.timing || "-";
    document.getElementById("method").textContent = target.pesticide?.method || "-";
  }
  
  window.addEventListener("DOMContentLoaded", loadVirusInfo);
  