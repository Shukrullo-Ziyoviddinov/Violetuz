# Beauty Engine

Tashqi kod faqat shu papkaning `index.js` faylidan oladi.

```js
import { createBeautyEngine, useBeautyEngine, BeautyEffectStrip } from '../features/beauty-engine';
```

`core`, `hooks` va `components` ichidagi fayllar yopiq. Chat, shorts, story va live ularni to‘g‘ridan-to‘g‘ri import qilmaydi.

Modul kamera ochmaydi, mikrofon trekini to‘xtatmaydi, sahifa va yo‘l qo‘shmaydi. Dvigatel tayyor oqimni qabul qiladi. WebGL va mahalliy yuz modeli turganida qayta ishlangan video oqimini qaytaradi. Ulardan biri yo‘q bo‘lsa, asl kamera oqimi qaytadi va yozish yiqilmaydi.

Tekislash, teri, yorug‘lik va yuz chizig‘i alohida effekt fayllarida. Har biri 0 dan 100 gacha. 0 bo‘lsa o‘sha effekt ishlamaydi va model shu kadrda yurmaydi. Ko‘z, qosh, lab va soch niqobdan tashqarida qoladi, shu joylar o‘tkir turadi.

Yuz nuqtalari faqat yuz effekti yoniganda o‘lchanadi. Yuz, jag‘, ko‘z va burun 0 dan 100 gacha. Yuz topilmasa kadr o‘z holida ketadi, eski nuqta bilan cho‘zilmaydi.

Fon: xira, rasm, video, rang, gradient, asl. Rasm va video faqat tayyor http manzildan chiziladi. Yangi server yo‘li yo‘q. Odam ajratilmasa yoki manzil ochilmasa kadr asl holda qoladi. Video ovozsiz va aylana turadi, mikrofon trekiga tegilmaydi.

Filtrlar config ro‘yxatidan olinadi: Original, Natural, Soft va qolganlari. Yorqinlik, kontrast, harorat va qolgan sozlashlar filtr bahosiga qo‘shiladi, alohida saqlanadi. Hammasi nol bo‘lsa kadr o‘zgarmaydi va yuz modeli yurmaydi.

`useBeautyEngine` har renderda yangi dvigatel ochmaydi. Yopilganda WebGL, model workeri va modul ochgan vaqtinchalik manzillar tozalanadi. Kamera va mikrofon treklari to‘xtatilmaydi.

Tanlash qatori dumaloq va gorizontal suriladi. Yozish ekranida u ikki matnning o‘rnida turadi. Qirqish ekranidagi «chetlarini suring» matni qoladi. Barmoq yozish tugmasida turganda qator qimirlamaydi.

Modul testi dvigatel, sozlama va tanlash qatorini shu papkada tekshiradi. Chat komponentlari testda yo‘q.

Yozish oynasi modulga o‘z kamerasini beradi. Ekranda qayta ishlangan kadr turadi. Yozuv shu video trekini va o‘z mikrofonini oladi. Galereya, kamera almashtirish va yozish tugmasi o‘z joyida qoladi.

Effekt, filtr, fon va tayyor ko‘rinish `config/beautyConfig.js` ichida. Yangi band shu ro‘yxatga qo‘shiladi. Tanlash komponenti ro‘yxatni o‘zida saqlamaydi.

Saqlash kaliti faqat `violetplay_beauty_settings`. Boshqa `localStorage` kaliti o‘qilmaydi va yozilmaydi. Rasm va video fayli bu kalitga tushmaydi, faqat qisqa http manzil saqlanadi.

Model va WASM `npm run beauty:setup` bilan `public/beauty/` ga tushadi. Ishlash paytida ular faqat `/beauty/wasm` va `/beauty/models/` dan olinadi.
