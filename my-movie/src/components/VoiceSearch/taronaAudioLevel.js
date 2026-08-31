/**
 * Client-side: blob RMS (0..1). Juda past bo'lsa identify yuborilmaydi.
 */
export const analyzeAudioBlobRms = async (blob) => {
  if (!blob?.size) return 0;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return 1;

  const ctx = new AudioCtx();
  try {
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buffer.getChannelData(0);
    if (!data?.length) return 0;

    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  } catch {
    return 1;
  } finally {
    await ctx.close().catch(() => {});
  }
};

/** ~-40 dBFS ga yaqin; jim/shovqinsiz yozuvni ushlaydi */
export const MIN_TARONA_RMS = 0.012;

export const isTaronaAudioLoudEnough = (rms) => rms >= MIN_TARONA_RMS;
