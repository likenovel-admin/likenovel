export interface IPopup {
  id: number;
  url: string;
  imagePath: string;
}

export interface ISelectPopupsResponse {
  data: IPopup;
}
