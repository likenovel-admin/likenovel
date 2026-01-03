export interface ICreateUploadResponse {
  data: {
    fileId: number;
    uploadPath: string;
  };
}

export interface IUpdateUploadResponse {
  data: {
    message: string;
  };
}

export interface ISelectPresignedFilePathResponseByEpisode {
  data: { episodeImageFileId: number; episodeImageUploadPath: string };
}

export interface ISelectStoragePathResponse {
  data: { episodeImageDownloadPath: string };
}
