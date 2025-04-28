import * as regionRepository from "../data/region.mjs";
import * as virusRepository from "../data/virus.mjs";

export async function getRegion(req, res, next) {
  const region = req.query.region;
  const data = await regionRepository.getById(region);
  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ message: `${region}의 데이터가가 없습니다.` });
  }
}

export async function getCropVirus(req, res, next) {
  const crop = req.params.crop;
  const data = await virusRepository.getByCrop(crop);
  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ message: `${crop}의 데이터가가 없습니다.` });
  }
}
