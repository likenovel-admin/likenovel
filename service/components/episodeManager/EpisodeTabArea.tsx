import { IEpisode, INotice } from "@/types";
import { useState } from "react";
import { IComment } from "../common/CommentArea";
import Tab from "../common/Tab";
import CommentTab from "./CommentTab";
import EpisodeRoundTab from "./EpisodeRoundTab";
import NoticeTab from "./NoticeTab";

interface EpisodeTabAreaProps {
  episodes: IEpisode[];
  notices: INotice[];
  productId: number;
  productPriceType?: "free" | "paid";
  productType?: "free" | "normal" | "paid";
  comments?: IComment[];
  updateFrequency?: string;
}

const EpisodeTabArea = ({
  episodes,
  notices,
  productId,
  productPriceType,
  productType,
  comments,
  updateFrequency,
}: EpisodeTabAreaProps) => {
  const [activeTab, setActiveTab] = useState("episode");
  return (
    <div>
      <Tab
        tabs={[
          {
            label: (
              <span>
                작품회차{" "}
                <span className="text-primary-100">{episodes.length}</span>
              </span>
            ),
            value: "episode",
          },
          { label: "공지", value: "notice" },
          {
            label: (
              <span>
                댓글{" "}
                <span className="text-primary-100">
                  {comments?.length || 0}
                </span>
              </span>
            ),
            value: "reply",
          },
        ]}
        style="overline"
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value)}
      />
      <div className="mt-4 px-5 md:px-0">
        {activeTab === "episode" && (
          <EpisodeRoundTab
            episodes={episodes}
            updateFrequency={updateFrequency}
            productId={productId}
            productPriceType={productPriceType}
            productType={productType}
          />
        )}
        {activeTab === "notice" && <NoticeTab notices={notices} />}
        {activeTab === "reply" && (
          <CommentTab productId={productId} comments={comments} />
        )}
      </div>
    </div>
  );
};

export default EpisodeTabArea;
