"use client";
import Button from "@/components/common/Button";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>링크</th>
            <th>url</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-4">
              <Button
                onClick={() => router.push("/product/customer-service/notice")}
              >
                공지사항
              </Button>
            </td>
            <td className="p-4">/product/customer-service/notice</td>
            <td className="p-4">각탭에 링크 연결</td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/notification")}>
                알림(pc)
              </Button>
            </td>
            <td className="p-4">/product/notification</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/notification")}>
                알림(mobile)
              </Button>
            </td>
            <td className="p-4">/notification</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/promotion")}>
                프로모션
              </Button>
            </td>
            <td className="p-4">/product/promotion</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/review")}>
                작품리뷰
              </Button>
            </td>
            <td className="p-4">/product/review</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/review/123")}>
                작품리뷰상세
              </Button>
            </td>
            <td className="p-4">/review/[id]</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/review/regist")}>
                리뷰등록
              </Button>
            </td>
            <td className="p-4">/review/regist</td>
            <td className="p-4">작품찾기 팝업 찾기버튼 누르면 뜨게 해놓음</td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/present")}>
                선물함
              </Button>
            </td>
            <td className="p-4">/product/present</td>
            <td className="p-4">탭마다 달라짐</td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/event")}>
                이벤트
              </Button>
            </td>
            <td className="p-4">/product/event</td>
            <td className="p-4">하나 선택하면 상세로 이동</td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/vote")}>투표</Button>
            </td>
            <td className="p-4">/product/vote</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/product/quest")}>
                퀘스트
              </Button>
            </td>
            <td className="p-4">/product/quest</td>
            <td className="p-4"></td>
          </tr>
          <tr>
            <td className="p-4">
              <Button onClick={() => router.push("/modal-sample")}>
                모달샘플
              </Button>
            </td>
            <td className="p-4">/modal-sample</td>
            <td className="p-4">각종 모달들 모두 모아 놓은 페이지</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Page;
