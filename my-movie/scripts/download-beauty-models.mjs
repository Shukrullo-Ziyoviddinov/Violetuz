import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const beautyDir = join(root, 'public', 'beauty');
const modelDir = join(beautyDir, 'models');
const wasmDir = join(beautyDir, 'wasm');
const licenseDir = join(beautyDir, 'licenses');
const packageDir = join(root, 'node_modules', '@mediapipe', 'tasks-vision');
const wasmSource = join(packageDir, 'wasm');
const manifestPath = join(licenseDir, 'manifest.json');

const models = [
  {
    file: 'face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    version: 'float16/1',
    expectedBytes: 3758596,
    license: 'Apache-2.0',
    modelCard: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf',
    note: '478 ta yuz nuqtasi. Shaxsni aniqlash va kuzatuv uchun emas.',
  },
  {
    file: 'selfie_segmenter.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
    version: 'float16/1',
    expectedBytes: 249537,
    license: 'Apache-2.0',
    modelCard: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf',
    note: 'Odam va fon. Piksel-aniq niqob talab qiladigan ish uchun emas.',
  },
  {
    file: 'selfie_multiclass_256x256.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite',
    version: 'float32/1',
    expectedBytes: 16371837,
    license: 'Apache-2.0',
    modelCard: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Multiclass%20Segmentation.pdf',
    note: 'Fon, soch, tana, yuz, kiyim. Shaxsni aniqlash va kuzatuv uchun emas.',
  },
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const readManifest = () => {
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
};

const sameFile = (left, right) => {
  if (!existsSync(left) || !existsSync(right)) return false;
  const a = readFileSync(left);
  const b = readFileSync(right);
  return a.length === b.length && sha256(a) === sha256(b);
};

const downloadModel = async (model) => {
  const destination = join(modelDir, model.file);
  const previous = readManifest()?.models?.find((item) => item.file === model.file);
  if (existsSync(destination) && previous?.sha256 && previous.bytes === model.expectedBytes) {
    const current = readFileSync(destination);
    if (current.length === model.expectedBytes && sha256(current) === previous.sha256) {
      console.log(`o‘tkazildi  ${model.file}`);
      return {
        ...model,
        path: `/beauty/models/${model.file}`,
        sha256: previous.sha256,
        bytes: current.length,
      };
    }
  }

  console.log(`yuklanmoqda ${model.file}`);
  let response;
  try {
    response = await fetch(model.url);
  } catch (error) {
    fail(`Model yuklanmadi: ${model.file}\n${error.message}`);
  }
  if (!response.ok) fail(`Model yuklanmadi: ${model.file} (${response.status})`);
  const type = response.headers.get('content-type') || '';
  if (type.includes('text/html')) fail(`Model o‘rniga sahifa keldi: ${model.file}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length !== model.expectedBytes) {
    fail(`Model hajmi mos emas: ${model.file} (${buffer.length}, kutilgan ${model.expectedBytes})`);
  }
  writeFileSync(destination, buffer);
  return {
    ...model,
    path: `/beauty/models/${model.file}`,
    sha256: sha256(buffer),
    bytes: buffer.length,
  };
};

const copyWasm = () => {
  if (!existsSync(wasmSource)) {
    fail('WASM topilmadi. Avval npm install @mediapipe/tasks-vision qiling.');
  }
  const names = readdirSync(wasmSource).filter((name) => statSync(join(wasmSource, name)).isFile());
  if (!names.length) fail('WASM papkasi bo‘sh.');
  return names.map((name) => {
    const source = join(wasmSource, name);
    const destination = join(wasmDir, name);
    if (sameFile(source, destination)) {
      console.log(`o‘tkazildi  wasm/${name}`);
    } else {
      copyFileSync(source, destination);
      console.log(`nusxa      wasm/${name}`);
    }
    const buffer = readFileSync(destination);
    return { file: name, sha256: sha256(buffer), bytes: buffer.length };
  });
};

const copyLicense = async () => {
  const destination = join(licenseDir, 'Apache-2.0.txt');
  const packaged = ['LICENSE', 'LICENSE.txt'].map((name) => join(packageDir, name)).find((path) => existsSync(path));
  if (packaged) {
    if (!sameFile(packaged, destination)) copyFileSync(packaged, destination);
    return;
  }
  if (existsSync(destination) && statSync(destination).size > 1000) return;
  let response;
  try {
    response = await fetch('https://www.apache.org/licenses/LICENSE-2.0.txt');
  } catch (error) {
    fail(`Apache-2.0 matni yuklanmadi.\n${error.message}`);
  }
  if (!response.ok) fail(`Apache-2.0 matni yuklanmadi (${response.status}).`);
  const text = await response.text();
  if (!text.includes('Apache License')) fail('Apache-2.0 matni noto‘g‘ri.');
  writeFileSync(destination, text);
};

const packageVersion = () => {
  const path = join(packageDir, 'package.json');
  if (!existsSync(path)) fail('Paket o‘rnatilmagan: @mediapipe/tasks-vision');
  return JSON.parse(readFileSync(path, 'utf8')).version;
};

const writeNotice = (version) => {
  const lines = [
    '# Beauty model va WASM',
    '',
    `Kutubxona: @mediapipe/tasks-vision@${version}`,
    'Litsenziya: Apache-2.0. Matn shu papkadagi Apache-2.0.txt faylida.',
    'Muallif: Google LLC.',
    '',
    'Ishlash paytida model va WASM shu saytning /beauty/ papkasidan olinadi.',
    'Tarmoqdan model so‘ralmaydi.',
    '',
    'Modellar shaxsni aniqlash yoki kuzatuv uchun emas. Violet Play ularni faqat kameradagi ko‘rinish effekti uchun ishlatadi.',
    '',
  ];
  writeFileSync(join(licenseDir, 'NOTICE.md'), lines.join('\n'));
};

const main = async () => {
  [modelDir, wasmDir, licenseDir, join(beautyDir, 'backgrounds'), join(beautyDir, 'luts')].forEach((dir) => {
    mkdirSync(dir, { recursive: true });
  });
  writeFileSync(join(beautyDir, 'backgrounds', '.gitkeep'), '');
  writeFileSync(join(beautyDir, 'luts', '.gitkeep'), '');

  const version = packageVersion();
  const savedModels = [];
  for (const model of models) savedModels.push(await downloadModel(model));
  const wasm = copyWasm();
  await copyLicense();
  writeNotice(version);

  const manifest = {
    package: '@mediapipe/tasks-vision',
    packageVersion: version,
    license: 'Apache-2.0',
    runtime: 'local',
    models: savedModels.map(({ file, path, url, version: modelVersion, license, modelCard, note, sha256: hash, bytes }) => ({
      file,
      path,
      source: url,
      version: modelVersion,
      license,
      modelCard,
      note,
      sha256: hash,
      bytes,
    })),
    wasm,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`tayyor      @mediapipe/tasks-vision@${version}`);
};

main().catch((error) => fail(error?.message || String(error)));
