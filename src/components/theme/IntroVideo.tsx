'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, RotateCcw, Volume2 } from 'lucide-react';
import { parseVideoEmbed } from '@/lib/themeColors';

/**
 * The host's video message at the top of the invitation card.
 *
 * Autoplay *with sound* is not something a page can decide: browsers only allow
 * it after the visitor has interacted with the page, or for sites they use
 * often. A plain `autoplay` attribute is therefore silently ignored for most
 * participants and the video never starts at all.
 *
 * So the sound is attempted, and the provider's player API is used to find out
 * whether playback actually began. If it did not, the video is muted and
 * restarted — which browsers do allow — and an unmute button appears. One click
 * and the participant hears it from wherever it has got to.
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

export function IntroVideo({
  url,
  className,
}: {
  url: string | null;
  className?: string;
}) {
  const t = useTranslations('appearance');
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  // Cover the player until it is actually playing, and again once it has
  // finished: those are the two states where the provider draws its own
  // chrome — the title and channel strip before the first frame, the end
  // screen with replay and suggestions afterwards. Neither can be turned off
  // through embed parameters (`modestbranding` no longer does anything), so
  // the only way to keep them off a participant's screen is not to let them
  // be seen. Paused is deliberately not covered: hiding the video the moment
  // someone pauses it would be worse than the strip they were trying to read.
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const unmuteRef = useRef<(() => void) | null>(null);
  const replayRef = useRef<(() => void) | null>(null);

  const embed = parseVideoEmbed(url);

  useEffect(() => {
    if (!embed || !containerRef.current) return;

    let cancelled = false;
    let player: any = null;

    // Give the unmuted attempt a moment to get going. Under a second is too
    // eager on a slow connection, where the video is still buffering rather
    // than blocked.
    const GRACE_MS = 1500;

    const setup = async () => {
      try {
        if (embed.provider === 'youtube') {
          const YT = await loadYouTubeApi();
          if (cancelled || !containerRef.current) return;

          player = new YT.Player(containerRef.current, {
            videoId: embed.id,
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
              autoplay: 1,
              playsinline: 1,
              // Keep the player as quiet as an embed allows: no control bar,
              // no annotations, no keyboard shortcuts, and related videos at
              // the end limited to the host's own channel. The title strip
              // before playback and the end screen after it are handled by the
              // cover below; what remains is the strip YouTube draws on hover
              // during playback, which an embed cannot suppress.
              controls: 0,
              rel: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              disablekb: 1,
              fs: 0,
            },
            events: {
              onReady: (event: any) => {
                event.target.playVideo();
                setTimeout(() => {
                  if (cancelled) return;
                  const state = event.target.getPlayerState();
                  // 1 playing, 3 buffering — anything else means the browser
                  // refused the unmuted start.
                  if (state !== 1 && state !== 3) {
                    event.target.mute();
                    event.target.playVideo();
                    setMuted(true);
                  }
                }, GRACE_MS);
              },
              onStateChange: (event: any) => {
                if (cancelled) return;
                if (event.data === 1) {
                  setStarted(true);
                  setEnded(false);
                } else if (event.data === 0) {
                  setEnded(true);
                }
              },
            },
          });

          unmuteRef.current = () => {
            player?.unMute?.();
            player?.playVideo?.();
          };
          replayRef.current = () => {
            player?.seekTo?.(0);
            player?.playVideo?.();
          };
          return;
        }

        await loadScript(VIMEO_API);
        if (cancelled || !containerRef.current) return;

        const Vimeo = (window as any).Vimeo;
        player = new Vimeo.Player(containerRef.current, {
          id: embed.id,
          autoplay: true,
          muted: false,
          responsive: true,
          dnt: true,
          controls: false,
          title: false,
          byline: false,
          portrait: false,
        });

        // Vimeo rejects the play() promise when autoplay is blocked, so the
        // fallback needs no timer here.
        player.play().catch(async () => {
          if (cancelled) return;
          await player.setMuted(true);
          await player.play().catch(() => setFailed(true));
          setMuted(true);
        });

        player.on('playing', () => {
          if (cancelled) return;
          setStarted(true);
          setEnded(false);
        });
        player.on('ended', () => {
          if (!cancelled) setEnded(true);
        });

        unmuteRef.current = () => {
          player?.setMuted(false);
          player?.play();
        };
        replayRef.current = () => {
          player?.setCurrentTime(0);
          player?.play();
        };
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    setup();

    return () => {
      cancelled = true;
      unmuteRef.current = null;
      replayRef.current = null;
      try {
        player?.destroy?.();
      } catch {
        // The player may already be gone with the container; nothing to do.
      }
    };
  }, [embed?.provider, embed?.id]);

  if (!embed) return null;

  // A blocked or broken player must not leave a dead grey box above the
  // welcome text, so the whole block goes away instead.
  if (failed) return null;

  const covered = !started || ended;

  return (
    <div className={className ?? 'mb-8'}>
      <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-md">
        <div className="aspect-video [&>iframe]:h-full [&>iframe]:w-full">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {covered && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            {ended ? (
              <button
                type="button"
                onClick={() => {
                  replayRef.current?.();
                  setEnded(false);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                {t('replay')}
              </button>
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            )}
          </div>
        )}
      </div>
      {muted && (
        <button
          type="button"
          onClick={() => {
            unmuteRef.current?.();
            setMuted(false);
          }}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Volume2 className="h-4 w-4" />
          {t('unmute')}
        </button>
      )}
    </div>
  );
}
