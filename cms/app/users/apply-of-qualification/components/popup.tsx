import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

interface DocumentsPopupProps {
  close: () => void;
  fileList: {
    name: string;
    url: string;
  }[];
}

const DocumentsPopup = ({ close, fileList }: DocumentsPopupProps) => {
  return (
    <div className="documents-popup-wrapper">
      <div className="documents-popup shadow">
        <div className="documents-popup-main w-96">
          <h1>서류 다운로드</h1>
          <Table>
            {fileList.length > 0 ? (
              <TableBody>
                <TableRow>
                  <TableHead>문서명</TableHead>
                  <TableHead>다운로드</TableHead>
                </TableRow>
                {fileList.map((item) => {
                  return (
                    <TableRow>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          onClick={() => window.open(item.url, "_blank")}
                        >
                          다운로드
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            ) : (
              <TableRow>
                <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
                  No data
                </div>
              </TableRow>
            )}
          </Table>
          <div className="documents-popup-buttons">
            <Button variant="outline" onClick={close}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DocumentsPopup };
