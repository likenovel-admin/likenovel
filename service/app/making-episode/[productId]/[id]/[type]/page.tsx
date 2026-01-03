"use client";

import FormArea from "@/components/makingEpisode/FormArea";
import EpisodeNav from "@/components/menu/EpisodeNav";
import { useParams } from "next/navigation";

export default function MakingEpisode() {
  const params = useParams();
  const productId = Number(params.productId);
  const episodeId = Number(params.id);
  const type = params.type as "episode" | "notice";
  const actionType = "submit";

  return (
    <div className="w-full h-auto">
      <EpisodeNav productId={productId} episodeId={episodeId} />
      <FormArea
        productId={productId}
        episodeId={episodeId}
        actionType={actionType}
        type={type}
      />
    </div>
  );
}
