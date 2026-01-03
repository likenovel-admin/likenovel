import { IAlgorithmSection } from "@/types/algorithm";

type UpdateBody = {
  id: string;
  field: string;
  value: string;
};
export const reducer = (
  state: IAlgorithmSection[],
  action: {
    type: "SET_INITIAL_STATE" | "EDIT_FEATURE" | "CLEAR";
    payload: UpdateBody | IAlgorithmSection[];
  }
) => {
  switch (action.type) {
    case "SET_INITIAL_STATE":
      return [...(action.payload as IAlgorithmSection[])];
    case "CLEAR":
      return [] as IAlgorithmSection[];
    case "EDIT_FEATURE":
      return state.map((row) => {
        const dataUpdate = action.payload as UpdateBody;
        if (row.id === Number(dataUpdate.id)) {
          return {
            ...row,
            feature: dataUpdate.value,
          };
        }
        return row;
      }) as IAlgorithmSection[];

    default:
      return state;
  }
};
