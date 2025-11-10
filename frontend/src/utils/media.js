const STREAMABLE_EXTENSIONS = [/\.mp4(\?|$)/i];

export const isStreamableAsset = (url) => STREAMABLE_EXTENSIONS.some((regex) => regex.test(url || ''));

export const resolveEmbedUrl = (url) => {
  if (!url) return null;
  if (isStreamableAsset(url)) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'music.youtube.com'
    ) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (host.endsWith('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  } catch (error) {
    return null;
  }
};

export const resolveMedia = (candidateUrls = []) => {
  for (const url of candidateUrls) {
    if (!url || typeof url !== 'string') continue;

    if (isStreamableAsset(url)) {
      return { type: 'video', src: url };
    }

    const embed = resolveEmbedUrl(url);
    if (embed) {
      return { type: 'embed', src: embed };
    }
  }

  return null;
};
