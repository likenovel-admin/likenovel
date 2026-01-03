"use client";

import FormArea from "@/components/makingEpisode/FormArea";
import EpisodeNav from "@/components/menu/EpisodeNav";
import { useParams } from "next/navigation";

export default function MakingEpisode() {
  const params = useParams();
  const productId = Number(params.productId);

  return (
    <div className="w-full h-auto">
      <EpisodeNav productId={productId} />
      <FormArea productId={productId} actionType="save" />
    </div>
  );
}
