import {
  Collection,
  Message,
  Snowflake,
  TextBasedChannel,
  VoiceChannel,
} from "discord.js";
import { shuffle } from "../newutils/helpers";
import { search } from "../newutils/search";
import {
  LoopMode,
  PlatformType,
  PlayerEvents,
  PluginName,
} from "../typings/enums";
import {
  AudioPLayerOptions,
  ManagerConfigurations,
} from "../typings/interfaces";
import { AudioPlayer } from "./audioPlayer";
import { Filter } from "./filter";
import { Manager } from "./manager";
import { CustomFilters } from "../newutils/constants";

import { joinVC } from "../functions/joinVC";
import { leaveVC } from "../functions/leaveVC";
import { playTrack } from "../functions/playTrack";
import { queue } from "../functions/queue";
import { autoPlay } from "../functions/autoPlay";
import { addFilter } from "../functions/addFilter";
import { setFilter } from "../functions/setFilter";
import { removeFilter } from "../functions/removeFilter";
import { resetFilter } from "../functions/resetFilter";
import { getFilters } from "../functions/getFilters";
import { volume } from "../functions/volume";
import { seek } from "../functions/seek";
import { getCurrentTrackDuration } from "../functions/getCurrentTrackDuration";
import { hasPlayer } from "../functions/hasPlayer";
import { loopMode } from "../functions/loopMode";
import { loopStatus } from "../functions/loopStatus";
import { clearQueue } from "../functions/clearQueue";
import { pauseTrack } from "../functions/pauseTrack";
import { resumeTrack } from "../functions/resumeTrack";
import { stopTrack } from "../functions/stopTrack";
import { skipTrack } from "../functions/skipTrack";
import { skipTo } from "../functions/skipTo";
import { playPreviousTrack } from "../functions/playPreviousTrack";
import { queueLength } from "../functions/queueLength";
import { voicePing } from "../functions/voicePing";
import { playerStatus } from "../functions/playerStatus";
import { stopPlayer } from "../functions/stopPlayer";
import { shuffleQueue } from "../functions/shuffleQueue";
import { unshuffleQueue } from "../functions/unshuffleQueue";
import { songInfo } from "../functions/songInfo";
import { search as searchFunction } from "../functions/search";

export class AoiVoice<T> extends Manager {
  #bot: T;
  prunes: Map<
    Snowflake,
    {
      message: Message<boolean>;
      channel: Snowflake;
    }
  >;
  cmds: {
    trackStart: Collection<string, Record<string, any>>;
    trackEnd: Collection<string, Record<string, any>>;
    queueEnd: Collection<string, Record<string, any>>;
    audioError: Collection<string, Record<string, any>>;
    queueStart: Collection<string, Record<string, any>>;
    trackPause: Collection<string, Record<string, any>>;
    trackResume: Collection<string, Record<string, any>>;
  };
  #events: PlayerEvents[];
  #executor: Function;
  
  constructor(bot: T, managerConfig?: ManagerConfigurations) {
    super(managerConfig);
    this.#bot = bot;
    this.prunes = new Map();
    //@ts-ignore
    this.#bot.voiceManager = this;
    this.cmds = {
      [PlayerEvents.TrackStart]: new Collection<Snowflake, Record<string, any>>(),
      [PlayerEvents.TrackEnd]: new Collection<Snowflake, Record<string, any>>(),
      [PlayerEvents.QueueEnd]: new Collection<Snowflake, Record<string, any>>(),
      [PlayerEvents.AudioError]: new Collection<Snowflake, Record<string, any>>(),
      [PlayerEvents.QueueStart]: new Collection<Snowflake, Record<string, any>>(),
      [PlayerEvents.TrackPause]: new Collection<Snowflake, Record<string, any>>(),
      [PlayerEvents.TrackResume]: new Collection<Snowflake, Record<string, any>>(),
    };
    this.#events = [];
    this.#executor = () => {};
    this.#bindFunctions();
  }

  addEvent(event: PlayerEvents) {
    this.#events.push(event);
    this.#bindEvents(event);
  }

  addEvents(...events: PlayerEvents[]) {
    this.#events.push(...events);
    for (const event of events) {
      this.#bindEvents(event);
    }
  }

  bindExecutor(executor: Function) {
    this.#executor = executor;
  }

  #bindEvents(event: PlayerEvents) {
    this.on(event, (...data: any[]) => {
      const player: any = data.pop();
      this.cmds[event].forEach(async (cmd) => {
        if (!cmd.__compiled__) {
          let channel: TextBasedChannel;
          if (cmd.channel.startsWith("$")) {
            channel = (
              await this.#executor(
                this.#bot,
                {
                  // @ts-ignore
                  guild: this.#bot.guilds.cache.get(
                    player.options.connection.joinConfig.guildId
                  ),
                  // @ts-ignore
                  channel: this.#bot.channels.cache.get(
                    this.prunes.get(
                      player.options.connection.joinConfig.guildId
                    ).channel
                  ),
                },
                [],
                { code: cmd.channel, name: "NameParser" },
                undefined,
                true,
                undefined,
                {
                  data: data[0],
                  player: player,
                }
              )
            )?.code;
          }
          //@ts-ignore
          channel = this.#bot.channels.cache.get(channel);
          return await this.#executor(
            this.#bot,
            {
              // @ts-ignore
              guild: this.#bot.guilds.cache.get(
                player.options.connection.joinConfig.guildId
              ),
              // @ts-ignore
              channel: this.#bot.channels.cache.get(
                this.prunes.get(player.options.connection.joinConfig.guildId)
                  .channel
              ),
            },
            [],
            cmd,
            undefined,
            false,
            channel,
            {
              data: data[0],
            }
          );
        } else {
          return await cmd.__compiled__({
            bot: this.#bot,
            client: (<any>this.#bot).client,
            channel: this.prunes.get(
              player.options.connection.joinConfig.guildId
            ).channel,
            guild: (<any>this.#bot).guilds.cache.get(
              player.options.connection.joinConfig.guildId
            ),
            player: player,
          });
        }
      });
      return PlayerEvents[event];
    });
  }

  async joinVc({
    type = "default",
    voiceChannel,
    textChannel,
    selfDeaf = true,
    selfMute = false,
  }: {
    type: AudioPLayerOptions["type"];
    voiceChannel: VoiceChannel;
    textChannel: Snowflake;
    selfDeaf?: boolean;
    selfMute?: boolean;
  }) {
    await super
      .joinVc({
        type,
        voiceChannel,
        selfDeaf,
        selfMute,
      })
      .catch((e) => false);
    this.prunes.set(voiceChannel.guild.id, {
      message: null,
      channel: textChannel,
    });
    return true;
  }

  #bindFunctions() {
    // @ts-ignore
    if (this.#bot.functionManager) {
      // @ts-ignore
      if (this.#bot.functionManager.createCustomFunction) {
        // @ts-ignore
        this.#bot.functionManager.createFunction =
          // @ts-ignore
          this.#bot.functionManager.createCustomFunction;
      }

      const functionList = [
        joinVC,
        leaveVC,
        playTrack,
        queue,
        autoPlay,
        addFilter,
        setFilter,
        removeFilter,
        resetFilter,
        getFilters,
        volume,
        seek,
        getCurrentTrackDuration,
        hasPlayer,
        loopMode,
        loopStatus,
        clearQueue,
        pauseTrack,
        resumeTrack,
        stopTrack,
        skipTrack,
        skipTo,
        playPreviousTrack,
        queueLength,
        voicePing,
        playerStatus,
        stopPlayer,
        shuffleQueue,
        unshuffleQueue,
        songInfo,
        searchFunction
      ];

      for (const func of functionList) {
        //@ts-ignore
        this.#bot.functionManager.createFunction(func);
      }
    }
  }
}