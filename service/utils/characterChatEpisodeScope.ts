interface ResolveCharacterChatEpisodeScopeParams {
  entryEpisodeNo?: number;
  preparedEpisodeNo: number;
  accountReadEpisodeNo: number | null;
}

export interface CharacterChatEpisodeScope {
  entryEpisodeNo: number;
  initialReadEpisodeNo: number;
  maxSelectableEpisodeNo: number;
  selectableEpisodeNos: number[];
}

export const resolveCharacterChatEpisodeScope = ({
  entryEpisodeNo: rawEntryEpisodeNo,
  preparedEpisodeNo: rawPreparedEpisodeNo,
  accountReadEpisodeNo: rawAccountReadEpisodeNo,
}: ResolveCharacterChatEpisodeScopeParams): CharacterChatEpisodeScope => {
  const entryEpisodeNo = Math.max(Number(rawEntryEpisodeNo || 1), 1);
  const preparedEpisodeNo = Math.max(
    Number(rawPreparedEpisodeNo || 0),
    entryEpisodeNo
  );
  const accountReadEpisodeNo = Math.max(
    Number(rawAccountReadEpisodeNo || 0),
    0
  );
  const maxSelectableEpisodeNo =
    accountReadEpisodeNo >= entryEpisodeNo
      ? Math.max(
          Math.min(accountReadEpisodeNo, preparedEpisodeNo),
          entryEpisodeNo
        )
      : entryEpisodeNo;

  return {
    entryEpisodeNo,
    initialReadEpisodeNo: maxSelectableEpisodeNo,
    maxSelectableEpisodeNo,
    selectableEpisodeNos: Array.from(
      { length: maxSelectableEpisodeNo - entryEpisodeNo + 1 },
      (_, index) => maxSelectableEpisodeNo - index
    ),
  };
};
