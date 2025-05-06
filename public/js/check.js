const video = document.getElementById("scanner");

// 후면 카메라(facingMode: "environment") 요청
navigator.mediaDevices
  .getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  })
  .then((stream) => {
    // stream을 video.srcObject에 연결
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    console.error("카메라 연결 실패:", err);
    alert("카메라 권한이 필요합니다");
  });

// 버튼으로 제어하고 싶다면:
document.getElementById("startScan").addEventListener("click", () => {
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((s) => (video.srcObject = s))
    .catch(console.error);
});
document.getElementById("stopScan").addEventListener("click", () => {
  const tracks = video.srcObject?.getTracks() || [];
  tracks.forEach((t) => t.stop());
});
