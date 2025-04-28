let regions = [
  {
    경기도: "11B10101",
    강원도영서: "11D10301",
    강원도영동: "11D20501",
    충청북도: "11C10301",
    충청남도: "11C20401",
    전라북도: "11F10201",
    전라남도: "11F20501",
    경상북도: "11H10501",
    경상남도: "11H20401",
    제주도: "11G00201",
  },
];
export async function getById(region) {
  return regions.find((data) => data === region);
}
