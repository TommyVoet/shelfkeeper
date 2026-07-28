/**
 * Streepjescodes lezen.
 *
 * Android Chrome heeft BarcodeDetector ingebouwd: snel en niets te downloaden.
 * Safari en Firefox niet — daar laden we pas dán een WebAssembly-lezer (1 MB),
 * zodat Android-gebruikers er geen last van hebben.
 */

/** Formaten die op boeken staan (EAN-13 = ISBN; UPC komt voor op Amerikaanse uitgaven). */
const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const;
const WASM_FORMATS = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E'] as const;

export type ScannerKind = 'native' | 'wasm';

/** Camerabeeld of een canvas — met een canvas is de lezer ook zonder camera te testen. */
export type ScanSource = HTMLVideoElement | HTMLCanvasElement;

export interface Scanner {
  kind: ScannerKind;
  /** Alle codes die in dit beeld te zien zijn. */
  scan(source: ScanSource): Promise<string[]>;
  dispose(): void;
}

function sizeOf(source: ScanSource): { width: number; height: number } {
  return 'videoWidth' in source
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.width, height: source.height };
}

interface NativeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
interface NativeDetectorCtor {
  new (options?: { formats?: readonly string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
}

function nativeCtor(): NativeDetectorCtor | undefined {
  return (globalThis as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
}

export function hasNativeScanner(): boolean {
  return nativeCtor() !== undefined;
}

async function createNative(): Promise<Scanner | null> {
  const Ctor = nativeCtor();
  if (!Ctor) return null;
  try {
    const supported = await Ctor.getSupportedFormats();
    const formats = NATIVE_FORMATS.filter((f) => supported.includes(f));
    if (!formats.length) return null;
    const detector = new Ctor({ formats });
    return {
      kind: 'native',
      async scan(source) {
        const found = await detector.detect(source);
        return found.map((r) => r.rawValue);
      },
      dispose() {},
    };
  } catch {
    // Sommige browsers (oudere iOS) kennen de constructor wel maar werken niet.
    return null;
  }
}

/** Beeld verkleinen: de lezer heeft aan 640px breed genoeg en het scheelt veel rekenwerk. */
const MAX_WIDTH = 640;

async function createWasm(): Promise<Scanner> {
  const [{ prepareZXingModule, readBarcodes }, wasmUrl] = await Promise.all([
    import('zxing-wasm/reader'),
    import('zxing-wasm/reader/zxing_reader.wasm?url').then((m) => m.default as string),
  ]);
  prepareZXingModule({ overrides: { locateFile: () => wasmUrl } });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  return {
    kind: 'wasm',
    async scan(source) {
      const { width, height } = sizeOf(source);
      if (!ctx || !width) return [];
      const scale = Math.min(1, MAX_WIDTH / width);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const results = await readBarcodes(image, {
        formats: [...WASM_FORMATS],
        tryHarder: true,
        maxNumberOfSymbols: 3,
      });
      return results.map((r) => r.text).filter(Boolean);
    },
    dispose() {
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}

export async function createScanner(): Promise<Scanner> {
  return (await createNative()) ?? (await createWasm());
}
