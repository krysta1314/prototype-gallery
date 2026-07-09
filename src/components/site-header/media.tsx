"use client";

/* Shared media helpers: autoplaying looped video + url-based image/video picker. */

export function Loop({
  src,
  className,
  poster,
  controls,
}: {
  src: string;
  className?: string;
  poster?: string;
  controls?: boolean;
}) {
  return (
    <video
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={controls}
      className={className}
    />
  );
}

export const isVideoUrl = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);

/* Renders a video or image by URL extension (lets the data hold either). */
export function CardMedia({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return isVideoUrl(src) ? (
    <Loop src={src} className={className} />
  ) : (
    <img src={src} alt={alt} className={className} />
  );
}
