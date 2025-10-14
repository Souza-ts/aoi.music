export { Manager } from "./classes/manager";
export { AoiVoice } from "./classes/aoiVoice";
export { AudioPlayer } from "./classes/audioPlayer";
export { Filter } from "./classes/filter";

export {
  LoopMode,
  PlatformType,
  PlayerEvents,
  PluginName,
  PlayerState
} from "./typings/enums";

export type {
  AudioPLayerOptions,
  ManagerConfigurations,
  PlayerOptions,
  TrackData
} from "./typings/interfaces";

export type {
  SearchOptions,
  SearchResult
} from "./typings/types";

export {
  shuffle,
  formatDuration,
  parseUrl
} from "./newutils/helpers";

export {
  search,
  validateUrl
} from "./newutils/search";

export {
  CustomFilters,
  DefaultFilters
} from "./newutils/constants";