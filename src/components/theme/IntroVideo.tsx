'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Play, RotateCcw } from 'lucide-react';
import { parseVideoEmbed, type VideoEmbed } from '@/lib/themeColors';

/**
 * The host's video message at the top of the invitation card.
 *
 * Autoplay *with sound* is not something a page can decide: browsers only allow
 * it after the visitor has interacted with the page, or for sites they use
 * often. A plain `autoplay` attribute is therefore silently ignored for most
 * participants and the video never starts at all.
 *
 * So the sound is attempted, and the provider's player API is used to find out
 * whether playback actually began. If it did not, a play button appears over
 * the cover; the click is the gesture the browser was waiting for, so the video
 * then runs from the start with sound.
 *
 * Falling back to *muted* playback instead was worse: YouTube answers a muted
 * autoplay with an overlay of its own, prompting for sound and carrying the
 * video title and channel, and that overlay stays up until the visitor unmutes
 * — the very chrome this component exists to keep out of the way.
 *
 * The players are addressed through their SDKs rather than a bare iframe
 * because an iframe gives no way to tell "playing" from "blocked".
 */

const YT_API = 'https://www.youtube.com/iframe_api';
const VIMEO_API = 'https://player.vimeo.com/api/player.js';

/** Loads a third-party script once, even if several components ask at the same time. */
const loading = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const existing = loading.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  loading.set(src, promise);
  return promise;
}

/** The YouTube API signals readiness through a global callback, not the load event. */
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);

  return new Promise((resolve, reject) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(w.YT);
    };
    loadScript(YT_API).catch(reject);
  });
}

/** As quiet as an embed gets: no control bar, annotations, keyboard or fullscreen. */
const YT_PLAYER_VARS = {
  autoplay: 1,
  playsinline: 1,
  controls: 0,
  rel: 0,
  modestbranding: 1,
  iv_load_policy: 3,
  disablekb: 1,
  fs: 0,
} as const;

/** Playing. */
const YT_PLAYING = 1;
/** Buffering — on its way to playing, so not a blocked start. */
const YT_BUFFERING = 3;
/** Ended. */
const YT_ENDED = 0;

export function IntroVideo({
  url,
  className,
}: {
  url: string | null;
  className?: string;
}) {
  const t = useTranslations('appearance');

  // The wrapper, not the player: the SDKs replace the element they are given
  // with an iframe, so a ref aimed at that element is detached the moment the
  // player mounts and cannot be reused to rebuild one.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const cancelledRef = useRef(false);

  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  // Cover the player until it is actually playing, and again once it has
  // finished: those are the two states where the provider draws its own chrome
  // — the title and channel strip before the first frame, the end screen with
  // replay and suggestions afterwards. Neither can be turned off through embed
  // parameters (`modestbranding` no longer does anything), so the only way to
  // keep them off a participant's screen is not to let them be seen. Paused is
  // deliberately not covered: hiding the video the moment someone pauses it
  // would be worse than the strip they were trying to read.
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  const embed = parseVideoEmbed(url);
  const provider = embed?.provider;
  const videoId = embed?.id;

  /** A fresh element for the SDK to replace, inside the wrapper we keep. */
  const freshSlot = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    const slot = document.createElement('div');
    slot.className = 'h-full w-full';
    wrapper.replaceChildren(slot);
    return slot;
  }, []);

  const onYtState = useCallback((event: any) => {
    if (cancelledRef.current) return;
    if (event.data === YT_PLAYING) {
      setStarted(true);
      setEnded(false);
    } else if (event.data === YT_ENDED) {
      setEnded(true);
    }
  }, []);

  const mountYouTube = useCallback(
    (YT: any, id: string, withSound: boolean) => {
      const slot = freshSlot();
      if (!slot) return null;

      return new YT.Player(slot, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: YT_PLAYER_VARS,
        events: {
          onReady: (event: any) => {
            if (withSound) event.target.unMute();
            event.target.playVideo();
          },
          onStateChange: onYtState,
          // Deleted, private, or not allowed to be embedded. Without this the
          // block would sit there as a black box with a play button that does
          // nothing.
          onError: () => {
            if (!cancelledRef.current) setFailed(true);
          },
        },
      });
    },
    [freshSlot, onYtState],
  );

  useEffect(() => {
    if (!provider || !videoId || !wrapperRef.current) return;

    cancelledRef.current = false;

    // Give the attempt a moment to get going. Under a second is too eager on a
    // slow connection, where the video is still buffering rather than blocked.
    const GRACE_MS = 1500;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;

    const setup = async () => {
      try {
        if (provider === 'youtube') {
          const YT = await loadYouTubeApi();
          if (cancelledRef.current) return;

          playerRef.current = mountYouTube(YT, videoId, false);

          graceTimer = setTimeout(() => {
            if (cancelledRef.current) return;
            const state = playerRef.current?.getPlayerState?.();
            if (state !== YT_PLAYING && state !== YT_BUFFERING) setBlocked(true);
          }, GRACE_MS);
          return;
        }

        await loadScript(VIMEO_API);
        if (cancelledRef.current) return;

        const slot = freshSlot();
        if (!slot) return;

        const Vimeo = (window as any).Vimeo;
        const player = new Vimeo.Player(slot, {
          id: Number(videoId),
          autoplay: true,
          muted: false,
          responsive: true,
          dnt: true,
          controls: false,
          title: false,
          byline: false,
          portrait: false,
        });
        playerRef.current = player;

        // A deleted or private video only shows up here, once the player has
        // tried to load it. Without this the block would sit there as a black
        // box with a play button that does nothing.
        player.ready().catch(() => {
          if (!cancelledRef.current) setFailed(true);
        });

        // Vimeo rejects the play() promise when autoplay is blocked, so this
        // needs no timer.
        player.play().catch(() => {
          if (!cancelledRef.current) setBlocked(true);
        });

        player.on('playing', () => {
          if (cancelledRef.current) return;
          setStarted(true);
          setEnded(false);
        });
        player.on('ended', () => {
          if (!cancelledRef.current) setEnded(true);
        });
      } catch {
        if (!cancelledRef.current) setFailed(true);
      }
    };

    setup();

    return () => {
      cancelledRef.current = true;
      if (graceTimer) clearTimeout(graceTimer);
      try {
        playerRef.current?.destroy?.();
      } catch {
        // The player may already be gone with the container; nothing to do.
      }
      playerRef.current = null;
    };
  }, [provider, videoId, mountYouTube, freshSlot]);

  /**
   * Start over with sound, from the visitor's click.
   *
   * YouTube is rebuilt rather than told to unmute and play: user activation
   * does not reach a cross-origin child frame, so the existing player can
   * refuse exactly as it refused the autoplay. An iframe created during the
   * click inherits the gesture. Vimeo's SDK takes the call directly.
   */
  const handlePlayWithSound = () => {
    setBlocked(false);
    setStarted(false);

    if (provider === 'youtube') {
      const YT = (window as any).YT;
      if (!YT?.Player || !videoId) return;
      try {
        playerRef.current?.destroy?.();
      } catch {
        // Replaced below either way.
      }
      playerRef.current = mountYouTube(YT, videoId, true);
      return;
    }

    playerRef.current?.setMuted?.(false);
    playerRef.current?.setCurrentTime?.(0);
    playerRef.current?.play?.();
  };

  const handleReplay = () => {
    setEnded(false);
    if (provider === 'youtube') {
      playerRef.current?.seekTo?.(0);
      playerRef.current?.playVideo?.();
      return;
    }
    playerRef.current?.setCurrentTime?.(0);
    playerRef.current?.play?.();
  };

  if (!embed) return null;

  // A broken player must not leave a dead grey box above the welcome text, so
  // the whole block goes away instead.
  if (failed) return null;

  const covered = !started || ended;

  return (
    <div className={className ?? 'mb-8'}>
      <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-md">
        <div
          ref={wrapperRef}
          className="aspect-video [&>iframe]:h-full [&>iframe]:w-full"
        />

        {covered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900">
            {ended ? (
              <button
                type="button"
                onClick={handleReplay}
                className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                {t('replay')}
              </button>
            ) : blocked ? (
              <>
                <button
                  type="button"
                  onClick={handlePlayWithSound}
                  aria-label={t('playWithSound')}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                >
                  <Play className="ml-1 h-7 w-7 fill-current" />
                </button>
                <span className="text-sm text-white/70">
                  {t('playWithSound')}
                </span>
              </>
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
