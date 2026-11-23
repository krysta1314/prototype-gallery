// 免费工具 Video to GIF 用的 GIF89a 编码器(2026-11-19,自己写，不加依赖)。
// 做法：所有帧抽样建一张全局 256 色调色板(4-bit/通道分桶，按出现次数取前 256 桶，桶内取平均色),
// 像素按 5-bit/通道查表映射到最近色;LZW 压缩照 GIF 规范(无 early change),每帧 Graphic Control Extension 写延时，循环播放。
// 全在浏览器里跑，分块 await 让出主线程，页面不卡死。

class Bytes {
  buf = new Uint8Array(1 << 16);
  len = 0;
  private grow(n: number) {
    if (this.len + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.len + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }
  byte(b: number) {
    this.grow(1);
    this.buf[this.len++] = b & 0xff;
  }
  word(w: number) {
    this.byte(w & 0xff);
    this.byte((w >> 8) & 0xff);
  }
  str(s: string) {
    for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i));
  }
  bytes(a: ArrayLike<number>) {
    this.grow(a.length);
    for (let i = 0; i < a.length; i++) this.buf[this.len++] = a[i];
  }
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** 全局调色板：返回 768 字节 RGB + 5-bit 查表(32768 项，-1 = 未算) */
function buildPalette(frames: Uint8ClampedArray[]) {
  const count = new Float64Array(4096);
  const sr = new Float64Array(4096);
  const sg = new Float64Array(4096);
  const sb = new Float64Array(4096);
  const total = frames.reduce((n, f) => n + f.length / 4, 0);
  const step = Math.max(1, Math.floor(total / 400000)); // 最多抽 ~40 万像素
  for (const f of frames) {
    for (let i = 0; i < f.length; i += 4 * step) {
      const r = f[i], g = f[i + 1], b = f[i + 2];
      const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      count[k]++;
      sr[k] += r;
      sg[k] += g;
      sb[k] += b;
    }
  }
  const order = Array.from({ length: 4096 }, (_, i) => i)
    .filter((i) => count[i] > 0)
    .sort((a, b) => count[b] - count[a])
    .slice(0, 256);
  const pal = new Uint8Array(768);
  order.forEach((k, i) => {
    pal[i * 3] = Math.round(sr[k] / count[k]);
    pal[i * 3 + 1] = Math.round(sg[k] / count[k]);
    pal[i * 3 + 2] = Math.round(sb[k] / count[k]);
  });
  return { pal, size: Math.max(1, order.length) };
}

function mapper(pal: Uint8Array, size: number) {
  const lut = new Int16Array(32768).fill(-1);
  return (r: number, g: number, b: number) => {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let idx = lut[key];
    if (idx < 0) {
      const R = (r >> 3) * 8 + 4, G = (g >> 3) * 8 + 4, B = (b >> 3) * 8 + 4;
      let best = 0, bestD = Infinity;
      for (let i = 0; i < size; i++) {
        const dr = pal[i * 3] - R, dg = pal[i * 3 + 1] - G, db = pal[i * 3 + 2] - B;
        const d = dr * dr * 3 + dg * dg * 4 + db * db * 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      idx = lut[key] = best;
    }
    return idx;
  };
}

/* LZW(最小码长 8),输出成 255 字节的子块 */
const TABLE = new Int32Array(1 << 20);
const STAMP = new Int32Array(1 << 20);
let gen = 0;
function lzw(out: Bytes, idx: Uint8Array) {
  const MIN = 8, CLEAR = 256, EOI = 257;
  let size = MIN + 1, next = EOI + 1;
  const block = new Uint8Array(255);
  let blen = 0, cur = 0, shift = 0;
  const flushByte = (b: number) => {
    block[blen++] = b;
    if (blen === 255) {
      out.byte(255);
      out.bytes(block);
      blen = 0;
    }
  };
  const emit = (code: number) => {
    cur |= code << shift;
    shift += size;
    while (shift >= 8) {
      flushByte(cur & 0xff);
      cur >>>= 8;
      shift -= 8;
    }
  };
  out.byte(MIN);
  gen++;
  emit(CLEAR);
  let prefix = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const k = idx[i];
    const key = (prefix << 8) | k;
    if (STAMP[key] === gen) {
      prefix = TABLE[key];
      continue;
    }
    emit(prefix);
    if (next === 4096) {
      emit(CLEAR);
      next = EOI + 1;
      size = MIN + 1;
      gen++;
    } else {
      if (next >= 1 << size) size++;
      STAMP[key] = gen;
      TABLE[key] = next++;
    }
    prefix = k;
  }
  emit(prefix);
  emit(EOI);
  if (shift > 0) flushByte(cur & 0xff);
  if (blen) {
    out.byte(blen);
    out.bytes(block.subarray(0, blen));
  }
  out.byte(0);
}

/**
 * frames:每帧 RGBA(ImageData.data),同宽高;delayMs:每帧时长。
 * onProgress 0–1。
 */
export async function encodeGif(frames: Uint8ClampedArray[], w: number, h: number, delayMs: number, onProgress?: (p: number) => void): Promise<Blob> {
  const { pal, size } = buildPalette(frames);
  const near = mapper(pal, size);
  const out = new Bytes();
  out.str("GIF89a");
  out.word(w);
  out.word(h);
  out.byte(0xf7); // 有全局色表,8-bit 色深,256 色
  out.byte(0);
  out.byte(0);
  out.bytes(pal);
  // 无限循环
  out.bytes([0x21, 0xff, 0x0b]);
  out.str("NETSCAPE2.0");
  out.bytes([0x03, 0x01, 0x00, 0x00, 0x00]);
  const delay = Math.max(2, Math.round(delayMs / 10));
  const idx = new Uint8Array(w * h);
  for (let f = 0; f < frames.length; f++) {
    const px = frames[f];
    for (let i = 0, j = 0; j < idx.length; i += 4, j++) idx[j] = near(px[i], px[i + 1], px[i + 2]);
    out.bytes([0x21, 0xf9, 0x04, 0x04]);
    out.word(delay);
    out.bytes([0x00, 0x00]);
    out.byte(0x2c);
    out.word(0);
    out.word(0);
    out.word(w);
    out.word(h);
    out.byte(0);
    lzw(out, idx);
    onProgress?.((f + 1) / frames.length);
    await tick();
  }
  out.byte(0x3b);
  return new Blob([out.buf.slice(0, out.len)], { type: "image/gif" });
}
