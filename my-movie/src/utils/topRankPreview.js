/** Top 10 aktyor / artist kartochkasidagi o‘rin rasmlari. */
export const TOP_RANK_SRC = {
  1: '/img/top1_preview_rev_1.png',
  2: '/img/top2_preview_rev_1.png',
  3: '/img/top3_preview_rev_1.png',
  4: '/img/top4_preview_rev_1.png',
  5: '/img/top5_preview_rev_1.png',
  6: '/img/top6_preview_rev_1.png',
  7: '/img/top7_preview_rev_1.png',
  8: '/img/top8_preview_rev_1 (1).png',
  9: '/img/top9_preview_rev_1.png',
  10: '/img/top10_preview_rev_1.png',
};

export const topRankSrc = (rank) => TOP_RANK_SRC[Number(rank)] || '';
