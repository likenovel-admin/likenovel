type DownloadFileParams = {
  apiFunc: () => Promise<any>;
  defaultFileName: string;
  onLoading?: (loading: boolean) => void;
  onError?: (error: any) => void;
};

export const downloadFile = async ({
  apiFunc,
  defaultFileName,
  onLoading,
  onError,
}: DownloadFileParams) => {
  try {
    onLoading?.(true);

    const { data: blob, headers } = await apiFunc();

    const contentDisposition = headers.get("content-disposition");
    let filename = defaultFileName;

    const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
    if (encodedMatch?.[1]) {
      filename = decodeURIComponent(encodedMatch[1]);
    } else {
      const match = contentDisposition?.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    onLoading?.(false);
  } catch (error) {
    onLoading?.(false);
    onError?.(error);
  }
};

export const getKoreanFileName = (type: string): string => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const fileNameMap: Record<string, string> = {
    user: `유저_테이블_${today}.csv`,
    "set-theme": `주제_설정_테이블_${today}.csv`,
    "recommend-1": `추천1_내용비슷_${today}.csv`,
    "recommend-2": `추천2_장르비슷_${today}.csv`,
    "recommend-3": `추천3_장바구니_${today}.csv`,
  };

  return fileNameMap[type] || `데이터_다운로드_${today}.csv`;
};
