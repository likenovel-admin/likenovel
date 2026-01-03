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
