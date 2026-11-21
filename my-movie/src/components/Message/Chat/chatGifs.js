import { emojiMatches } from './chatEmojis';

const RECENT_KEY = 'violet-chat-gif-recent';
const RECENT_MAX = 24;

export const CHAT_GIFS = [
  {
    "file": "-_-.mp4",
    "name": "Bezovta",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Bezovta bezovta rolling eyes"
  },
  {
    "file": "@VideoToGifConverterBot(7) (4).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron VideoToGifConverterBot 7 4"
  },
  {
    "file": "#reactiongif 😭.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry reactiongif"
  },
  {
    "file": "#reactiongif 🙄.mp4",
    "name": "Bezovta",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Bezovta bezovta rolling eyes reactiongif"
  },
  {
    "file": "🤨6.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed 6"
  },
  {
    "file": "01.01.05,35-1.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 01 01 05 35 1"
  },
  {
    "file": "03.09.19,17-19.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 03 09 19 17 19"
  },
  {
    "file": "064 1-46.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 064 1 46"
  },
  {
    "file": "09_sad.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry 09 sad"
  },
  {
    "file": "1 (8).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 1 8"
  },
  {
    "file": "1 (93).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 1 93"
  },
  {
    "file": "1.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 1"
  },
  {
    "file": "10.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 10"
  },
  {
    "file": "11.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 11"
  },
  {
    "file": "11edc.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 11edc"
  },
  {
    "file": "16.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 16"
  },
  {
    "file": "18.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 18"
  },
  {
    "file": "2.MP4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 2"
  },
  {
    "file": "20-5.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 20 5"
  },
  {
    "file": "21_слеза.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry 21 слеза"
  },
  {
    "file": "21.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 21"
  },
  {
    "file": "23.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 23"
  },
  {
    "file": "234 (52).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 234 52"
  },
  {
    "file": "26.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 26"
  },
  {
    "file": "28 (2).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 28 2"
  },
  {
    "file": "3.MP4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 3"
  },
  {
    "file": "31_sad.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry 31 sad"
  },
  {
    "file": "31.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 31"
  },
  {
    "file": "4.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 4"
  },
  {
    "file": "440ScreenRecorderProject161 (online-video-cutter.com).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 440ScreenRecorderProject161 online video cutter com"
  },
  {
    "file": "54.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 54"
  },
  {
    "file": "6.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 6"
  },
  {
    "file": "61_panic.mp4",
    "name": "Qo'rquv",
    "cat": "fear",
    "tint": "#a78bfa",
    "q": "Qo'rquv qorquv qoqinchli vahima scream scare panic 61 panic"
  },
  {
    "file": "63.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 63"
  },
  {
    "file": "67.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 67"
  },
  {
    "file": "8_рука_лицо.mp4",
    "name": "Yuz",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Yuz yuz facepalm afsus 8 рука лицо"
  },
  {
    "file": "9 (11).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron 9 11"
  },
  {
    "file": "a 159-1.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron a 159 1"
  },
  {
    "file": "animation.gif.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gif"
  },
  {
    "file": "animation.gifc.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifc"
  },
  {
    "file": "animation.gifde.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifde"
  },
  {
    "file": "animation.gifdscd.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifdscd"
  },
  {
    "file": "animation.gifdwcd.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifdwcd"
  },
  {
    "file": "animation.gifed.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifed"
  },
  {
    "file": "animation.gifefevfv.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifefevfv"
  },
  {
    "file": "animation.gifefvfv.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifefvfv"
  },
  {
    "file": "animation.gifewd.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifewd"
  },
  {
    "file": "animation.gifewde.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifewde"
  },
  {
    "file": "animation.giffvf.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation giffvf"
  },
  {
    "file": "animation.gifswd.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifswd"
  },
  {
    "file": "animation.gifswx.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron animation gifswx"
  },
  {
    "file": "Avengers2012.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Avengers2012"
  },
  {
    "file": "bam.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron bam"
  },
  {
    "file": "bird_confused_compressed.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed bird confused compressed"
  },
  {
    "file": "blackish37.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron blackish37"
  },
  {
    "file": "CNTITL (10)_H.264.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron CNTITL 10 H 264"
  },
  {
    "file": "Crazy face.mp4",
    "name": "Kulgi",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Kulgi kulgi kulish jilmayish laugh smile joy Crazy face"
  },
  {
    "file": "crf27.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron crf27"
  },
  {
    "file": "D17.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron D17"
  },
  {
    "file": "dawq.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron dawq"
  },
  {
    "file": "dde.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron dde"
  },
  {
    "file": "despicable (71).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron despicable 71"
  },
  {
    "file": "doc_2021-11-08_19-35-30_1.33x_768x576_alq-12.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2021 11 08 19 35 30 1 33x 768x576 alq 12"
  },
  {
    "file": "doc_2026-11-21_14-03-45.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 03 45"
  },
  {
    "file": "doc_2026-11-21_14-04-11.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 04 11"
  },
  {
    "file": "doc_2026-11-21_14-04-18.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 04 18"
  },
  {
    "file": "doc_2026-11-21_14-04-35.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 04 35"
  },
  {
    "file": "doc_2026-11-21_14-04-45.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 04 45"
  },
  {
    "file": "doc_2026-11-21_14-05-11.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 05 11"
  },
  {
    "file": "doc_2026-11-21_14-05-26.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 05 26"
  },
  {
    "file": "doc_2026-11-21_14-06-45.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 06 45"
  },
  {
    "file": "doc_2026-11-21_14-06-52.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 06 52"
  },
  {
    "file": "doc_2026-11-21_14-07-56.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 07 56"
  },
  {
    "file": "doc_2026-11-21_14-09-18.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 09 18"
  },
  {
    "file": "doc_2026-11-21_14-09-42.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 09 42"
  },
  {
    "file": "doc_2026-11-21_14-10-47.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 10 47"
  },
  {
    "file": "doc_2026-11-21_14-10-50.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron doc 2026 11 21 14 10 50"
  },
  {
    "file": "edd.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron edd"
  },
  {
    "file": "Estu_KPS01_😡_SCut_H264High_BR107_C61_SP100_Q80_R1280x960_F24_AS4x3.mp4",
    "name": "Jahldor",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Jahldor jahldor ghazab angry Estu KPS01 SCut H264High BR107 C61 SP100 Q80 R1280x960 F24 AS4x3"
  },
  {
    "file": "facepalmst1-converted.mp4",
    "name": "Yuz",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Yuz yuz facepalm afsus facepalmst1 converted"
  },
  {
    "file": "final_618a6510a9e46c002993077f_237153.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron final 618a6510a9e46c002993077f 237153"
  },
  {
    "file": "final_618a7513d1d8c700442ee98e_246835.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron final 618a7513d1d8c700442ee98e 246835"
  },
  {
    "file": "firefly-2-rfrrfr.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed firefly 2 rfrrfr"
  },
  {
    "file": "Flushed 1.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Flushed 1"
  },
  {
    "file": "Flushed 1c.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Flushed 1c"
  },
  {
    "file": "Flushed.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Flushed"
  },
  {
    "file": "Fuuu2.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Fuuu2"
  },
  {
    "file": "g72.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron g72"
  },
  {
    "file": "garfild (86).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron garfild 86"
  },
  {
    "file": "gh654.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron gh654"
  },
  {
    "file": "gif 8.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron gif 8"
  },
  {
    "file": "gif10.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron gif10"
  },
  {
    "file": "gif17.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron gif17"
  },
  {
    "file": "gif19.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron gif19"
  },
  {
    "file": "gif9.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron gif9"
  },
  {
    "file": "Gravity_Falls_S02E07_Society_of_The_Blind_Eye_1080p_WEB_DL_AAC2.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Gravity Falls S02E07 Society of The Blind Eye 1080p WEB DL AAC2"
  },
  {
    "file": "Grimace 1.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Grimace 1"
  },
  {
    "file": "hugo gifs17.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron hugo gifs17"
  },
  {
    "file": "IMG_5426.MOV",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron IMG 5426"
  },
  {
    "file": "IMG_6670.MP4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron IMG 6670"
  },
  {
    "file": "IMG_8276.MP4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron IMG 8276"
  },
  {
    "file": "Index Up.mp4",
    "name": "Ishora",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Ishora ishora wave pointing Index Up"
  },
  {
    "file": "joy(6).mp4",
    "name": "Kulgi",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Kulgi kulgi kulish jilmayish laugh smile joy joy 6"
  },
  {
    "file": "korra cry.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry korra cry"
  },
  {
    "file": "look.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron look"
  },
  {
    "file": "LovedEyes.mp4",
    "name": "Sevgi",
    "cat": "love",
    "tint": "#fb7185",
    "q": "Sevgi sevgi yurak busa kiss love LovedEyes"
  },
  {
    "file": "LovedEyes16.mp4",
    "name": "Sevgi",
    "cat": "love",
    "tint": "#fb7185",
    "q": "Sevgi sevgi yurak busa kiss love LovedEyes16"
  },
  {
    "file": "luca gifs7.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron luca gifs7"
  },
  {
    "file": "Miyang_OKE_CS2_😞_SCut_H264High_BR151_C49_SP80_Q80_R1280x960_F24.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry Miyang OKE CS2 SCut H264High BR151 C49 SP80 Q80 R1280x960 F24"
  },
  {
    "file": "Mr Beannnnnnn26-72.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Mr Beannnnnnn26 72"
  },
  {
    "file": "nhie.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron nhie"
  },
  {
    "file": "O_O.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed O O"
  },
  {
    "file": "Oh_fuck.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Oh fuck"
  },
  {
    "file": "Peach.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Peach"
  },
  {
    "file": "Pointing 2.mp4",
    "name": "Ishora",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Ishora ishora wave pointing Pointing 2"
  },
  {
    "file": "Ratatouille 😮.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Ratatouille"
  },
  {
    "file": "RENDER.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron RENDER"
  },
  {
    "file": "Rolling eyes 2.mp4",
    "name": "Bezovta",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Bezovta bezovta rolling eyes Rolling eyes 2"
  },
  {
    "file": "rtn54.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron rtn54"
  },
  {
    "file": "Sad 2 (1).mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry Sad 2 1"
  },
  {
    "file": "Sadd.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry Sadd"
  },
  {
    "file": "Scared 6 (1).mp4",
    "name": "Qo'rquv",
    "cat": "fear",
    "tint": "#a78bfa",
    "q": "Qo'rquv qorquv qoqinchli vahima scream scare panic Scared 6 1"
  },
  {
    "file": "Scary6.mp4",
    "name": "Qo'rquv",
    "cat": "fear",
    "tint": "#a78bfa",
    "q": "Qo'rquv qorquv qoqinchli vahima scream scare panic Scary6"
  },
  {
    "file": "Scary8.mp4",
    "name": "Qo'rquv",
    "cat": "fear",
    "tint": "#a78bfa",
    "q": "Qo'rquv qorquv qoqinchli vahima scream scare panic Scary8"
  },
  {
    "file": "Screaming (3).mp4",
    "name": "Qo'rquv",
    "cat": "fear",
    "tint": "#a78bfa",
    "q": "Qo'rquv qorquv qoqinchli vahima scream scare panic Screaming 3"
  },
  {
    "file": "ScreenRecorderProject180.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron ScreenRecorderProject180"
  },
  {
    "file": "Skubi.Du.2002.RUS.BDRip.XviD.AC3.-HQCLUB_97.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Skubi Du 2002 RUS BDRip XviD AC3 HQCLUB 97"
  },
  {
    "file": "sloth.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron sloth"
  },
  {
    "file": "smirk2.mp4",
    "name": "Kulgi",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Kulgi kulgi kulish jilmayish laugh smile joy smirk2"
  },
  {
    "file": "SpiderMan2002-1.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron SpiderMan2002 1"
  },
  {
    "file": "Surprise5.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Surprise5"
  },
  {
    "file": "The Mask (1994) 19.29.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron The Mask 1994 19 29"
  },
  {
    "file": "thinking3.mp4",
    "name": "O'ylash",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "O'ylash oylash fikr thinking thinking3"
  },
  {
    "file": "Thumb up_2 (1).mp4",
    "name": "Ma'qul",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Ma'qul maqul thumb like Thumb up 2 1"
  },
  {
    "file": "Tom And Jerry.2021 51.07.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Tom And Jerry 2021 51 07"
  },
  {
    "file": "tom wave hand.mp4",
    "name": "Ishora",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Ishora ishora wave pointing tom wave hand"
  },
  {
    "file": "Tongue out.mp4",
    "name": "Kulgi",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Kulgi kulgi kulish jilmayish laugh smile joy Tongue out"
  },
  {
    "file": "Tongue outc.mp4",
    "name": "Kulgi",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Kulgi kulgi kulish jilmayish laugh smile joy Tongue outc"
  },
  {
    "file": "Untitled (32).mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Untitled 32"
  },
  {
    "file": "video_3.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron video 3"
  },
  {
    "file": "weary1.mp4",
    "name": "Charchagan",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Charchagan charchagan weary weary1"
  },
  {
    "file": "weg9_4.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron weg9 4"
  },
  {
    "file": "WHYHIM (11)_H.264.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron WHYHIM 11 H 264"
  },
  {
    "file": "WHYHIM (12)_H.264.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron WHYHIM 12 H 264"
  },
  {
    "file": "WHYHIM (15)_H.264.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron WHYHIM 15 H 264"
  },
  {
    "file": "Wolf Of39-33.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Wolf Of39 33"
  },
  {
    "file": "shgakehand.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron shgakehand"
  },
  {
    "file": "Shocked13.mp4",
    "name": "Hayron",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Hayron hayron hayrat surprise flushed Shocked13"
  },
  {
    "file": "shrek kiss.mp4",
    "name": "Sevgi",
    "cat": "love",
    "tint": "#fb7185",
    "q": "Sevgi sevgi yurak busa kiss love shrek kiss"
  },
  {
    "file": "Shutter Island2 🤦.mp4",
    "name": "Yuz",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Yuz yuz facepalm afsus Shutter Island2"
  },
  {
    "file": "злость_2.mp4",
    "name": "Jahldor",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Jahldor jahldor ghazab angry злость 2"
  },
  {
    "file": "РонУлыбка.mp4",
    "name": "Kulgi",
    "cat": "laugh",
    "tint": "#f5c542",
    "q": "Kulgi kulgi kulish jilmayish laugh smile joy РонУлыбка"
  },
  {
    "file": "Фокус_7.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Фокус 7"
  },
  {
    "file": "Хью_Джекман,_Майкл_Фассбендер,_Джеймс_Макэвой_S15e05_Шоу_Грэма_Нортона.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron Хью Джекман Майкл Фассбендер Джеймс Макэвой S15e05 Шоу Грэма Нортона"
  },
  {
    "file": "экспортировать-08.mp4",
    "name": "Reaksiya",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Reaksiya reaksiya hayron экспортировать 08"
  },
  {
    "file": "がっかり２.mp4",
    "name": "Xafa",
    "cat": "shock",
    "tint": "#38bdf8",
    "q": "Xafa xafa yiglamoq sad cry がっかり２"
  }
];

const byFile = new Map(CHAT_GIFS.map((item) => [item.file, item]));

export const gifByFile = (file) => byFile.get(String(file || '')) || null;

export const gifMatches = (item, query) => emojiMatches({ char: '', q: `${item.name} ${item.q}` }, query);

export const readRecentGifIds = () => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((file) => typeof file === 'string' && byFile.has(file)).slice(0, RECENT_MAX);
  } catch (_err) {
    return [];
  }
};

export const rememberGif = (file) => {
  const next = [file, ...readRecentGifIds().filter((item) => item !== file)].slice(0, RECENT_MAX);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
};
