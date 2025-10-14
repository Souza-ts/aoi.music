export { Manager } from "./newstruct/manager";
export { AoiVoice } from "./newstruct/aoiVoice";
export { AudioPlayer } from "./newstruct/audioPlayer";
export { Filter } from "./newstruct/filter";
export { Cacher } from "./newstruct/cacher";

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

export { request } from "./newutils/request";