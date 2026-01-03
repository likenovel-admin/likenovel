export interface IPanel {
  id: number;
  division: string;
  area: string;
  pcImgPath: string;
  mobileImgPath: string;
  textType: "char" | "img";
  topText: string;
  middleText: string;
  bottomText: string;
  textPosition: "leftTop" | "leftBottom";
  textImgPath: string;
  mobileTextImgPath: string;
  overlayYn: "Y" | "N";
  overlayType: "gradation" | "img";
  overlayImgPath: string;
  mobileOverlayImgPath: string;
  linkPath: string;
}

export interface IUseSelectPanelsResponse {
  data: IPanel[];
}
