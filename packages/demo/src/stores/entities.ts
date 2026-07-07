import { useEntityStore } from "@vue-cot/core";
import { defineStore } from "pinia";

export const useEntitiesStore = defineStore("entities", () => {
  return useEntityStore();
});
