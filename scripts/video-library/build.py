#!/usr/bin/env python3
"""Scan the Desktop project folders and build the video-library manifest.

Usage: python3 scripts/video-library/build.py
Writes  src/app/prototypes/(video-library)/video-library/library.json
        public/video-library/posters/<film-id>.jpg
Video URLs are filled in later by upload.mjs (urls.json); this script only knows local paths.
To add a new finished film: add a source entry below and rerun build + upload.
"""
import json, os, re, subprocess, glob, datetime, hashlib

HOME = os.path.expanduser('~')
D = lambda *p: os.path.join(HOME, 'Desktop', *p)
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'src/app/prototypes/(video-library)/video-library/library.json')
POSTERS = os.path.join(ROOT, 'public/video-library/posters')
URLS = os.path.join(ROOT, 'scripts/video-library/urls.json')
VIDEO_EXT = ('.mp4', '.mov')


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                        'stream=width,height:format=duration', '-of', 'json', path], capture_output=True, text=True)
    try:
        j = json.loads(r.stdout)
        s = j.get('streams', [{}])[0]
        return {'w': s.get('width'), 'h': s.get('height'), 'dur': round(float(j['format']['duration']), 1)}
    except Exception:
        return {'w': None, 'h': None, 'dur': None}


def fmeta(path, label):
    st = os.stat(path)
    m = probe(path)
    return {'label': label, 'name': os.path.basename(path), 'path': path, 'size': st.st_size,
            'mtime': datetime.datetime.fromtimestamp(st.st_mtime).strftime('%Y-%m-%d'), **m}


def version(label, files, note=''):
    files = [f for f in files if f]
    date = max((f['mtime'] for f in files), default='')
    return {'label': label, 'date': date, 'note': note, 'files': files}


def videos_in(folder):
    if not os.path.isdir(folder):
        return []
    return sorted(p for p in glob.glob(os.path.join(folder, '*')) if p.lower().endswith(VIDEO_EXT))


def ratio_label(m):
    if not m.get('w'):
        return ''
    r = m['w'] / m['h']
    return '9:16' if r < 0.8 else ('1:1' if r < 1.2 else '16:9')


def nice_label(path):
    """Readable label for one file inside a version."""
    n = os.path.basename(path).lower()
    tags = []
    if 'placeholder' in n:
        tags.append('占位配乐')
    if 'nomusic' in n:
        tags.append('无音乐')
    if 'alpha' in n:
        tags.append('透明底')
    if '_web' in n:
        tags.append('网页压缩版')
    if '_share' in n:
        tags.append('1080p 分享版')
    return ' · '.join(tags)


films = []


def add(fid, cat, title, versions, desc='', order=0):
    versions = [v for v in versions if v['files'] or v.get('note')]
    if not any(v['files'] for v in versions):
        return
    films.append({'id': fid, 'category': cat, 'title': title, 'desc': desc, 'order': order, 'versions': versions})


# ---------------- 宣讲片 ----------------
TALKS = [
    ('01_开场Demo', '开场 Demo', '一句话生成一整套 campaign'),
    ('02_Enterprise', 'Enterprise Plan', 'Enterprise 方案介绍'),
    ('03_MCP', 'BuzzVideo MCP', '在已经在用的 AI 工具里创作'),
    ('04_3DStudio', '3D Studio', 'K-pop 女团 MV：一句话搭 3D 场景，走位、运镜、灯光逐项控制，再生成真人 MV'),
    ('05_HybridReels', 'Hybrid Reels', '真实片段 + AI 自动补镜头'),
    ('06_CanvasAgent', 'Canvas Agent', '一句话加格、改图、生片'),
    ('08_MCPSkill_ProductAd', 'MCP Skills · Product Ad', '在 Claude 里用一张产品照 + 一句话，调用 Product Ad Skill 出一条可购物的竖版广告（给 sales）'),
]
for i, (d, title, desc) in enumerate(TALKS):
    base = D('BuzzVideo_Demo工程/宣讲片/成片', d)
    fs = []
    for p, lab in [(f'4K/{d}_4K.mp4', '4K 原版（大会播放）'), (f'压缩版/{d}_4K_压缩.mp4', '4K 压缩版'),
                   (f'压缩版/{d}_share.mp4', '1080p 分享版'), (f'压缩版/{d}_4K_Canva.mp4', '4K · 50MB 以内（Canva / 上传用）')]:
        if os.path.exists(os.path.join(base, p)):
            fs.append(fmeta(os.path.join(base, p), lab))
    if d == '08_MCPSkill_ProductAd':
        ad = D('BuzzVideo_Demo工程/宣讲片/08_SkillProductAd_素材', 'Mirelle_GlassLipGlaze_EN_9x16_15s.mp4')
        if os.path.exists(ad):
            fs.append(fmeta(ad, '片中广告 · 15 秒 9:16（Mirelle 唇釉）'))
    vs = [version('最新版', fs)]
    if d == '04_3DStudio':
        vs.append(version('第 1 版 · Kick 滑板', [], '2026-10-27 交付，按上级反馈「showcase more complex situation」重做后替换；文件已移到废纸篓，从废纸篓恢复后可补进来'))
    add('talk-' + d[:2], '宣讲片', f'{d[:2]} · {title}', vs, desc, i)

# ---------------- 模型宣传片 ----------------
for d in sorted(os.listdir(D('BuzzVideo_Demo工程/模型宣传片'))):
    base = D('BuzzVideo_Demo工程/模型宣传片', d)
    if not os.path.isdir(base):
        continue
    fs = []
    for p, lab in [(f'4K/{d}_4K.mp4', '4K 原版'), (f'压缩版/{d}_4K_压缩.mp4', '4K 压缩版'), (f'压缩版/{d}_share.mp4', '1080p 分享版')]:
        if os.path.exists(os.path.join(base, p)):
            fs.append(fmeta(os.path.join(base, p), lab))
    add('model-' + re.sub(r'[^a-z0-9]+', '-', d.lower()), '模型宣传片', d, [version('最新版', fs)], '模型上新宣传片')

# ---------------- 产品 Demo ----------------
b = D('BuzzVideo_Demo_30s_最终版')
add('demo-30s', '产品 Demo', '30 秒产品 Demo', [version('v3（最新）', [
    fmeta(os.path.join(b, 'BuzzVideo_Demo_30s_v3.mp4'), '原版'),
    fmeta(os.path.join(b, 'BuzzVideo_Demo_30s_v3_share.mp4'), '分享版')])], '产品手册开头的 30 秒演示')

# ---------------- 教程 ----------------
for n, t in [('ChatGPT', 'MCP 教程 · ChatGPT'), ('Claude', 'MCP 教程 · Claude')]:
    p = D('BuzzVideo-MCP教程工程/成片', f'BuzzVideo_MCP_{n}_Tutorial_30s.mp4')
    if os.path.exists(p):
        add('tutorial-' + n.lower(), '教程', t, [version('最新版', [fmeta(p, '原版')])], f'30 秒：在 {n} 里接入并使用 BuzzVideo MCP')

# ---------------- 产品内视频（弹窗 / 引导） ----------------
b = D('HybridReel弹窗视频工程')
add('popup-hybridreel', '产品内视频', 'Hybrid Reel 上新弹窗', [version('最新版', [
    fmeta(os.path.join(b, 'HybridReel上新弹窗-4K.mp4'), '4K 原版'),
    fmeta(os.path.join(b, 'HybridReel上新弹窗.mp4'), '1080p')])], '产品内上新弹窗视频')
b = D('BuzzVideo引导页工程/out')
add('onboarding', '产品内视频', '引导页广告', [
    version('最新版', [fmeta(os.path.join(b, 'onboarding-ad.mp4'), '原版')]),
], '新用户引导页里的广告视频')

# ---------------- Enterprise 画布案例 ----------------
b = D('Enterprise画布工程/成片/01-BuzzRose')
for k, t in [('B', '梳妆台场景（旁白）'), ('C', '送礼'), ('D', '卖点字卡快剪')]:
    fs = [fmeta(p, ratio_label(probe(p))) for p in [os.path.join(b, f'01{k}-9x16.mp4'), os.path.join(b, f'01{k}-16x9.mp4')] if os.path.exists(p)]
    add(f'ent-buzzrose-{k.lower()}', 'Enterprise 画布案例', f'BuzzRose Perfume · {k} {t}', [version('成片', fs)], 'Enterprise 画布交付案例 01')

# ---------------- Skill 示例 ----------------
T = D('BuzzVideo-MCP-Skills工程/tests')
BLOG = D('BuzzVideo博客工程/skill-blogs/_videos/out')
skills = sorted(os.path.splitext(os.path.basename(p))[0] for p in videos_in(BLOG))
for s in skills:
    blog = os.path.join(BLOG, s + '.mp4')
    if os.path.exists(blog):
        add('skill-' + s, 'Skill 示例', s, [version('最新版', [fmeta(blog, ratio_label(probe(blog)))])], 'MCP Skill 示例成片（博客 / 落地页用）')
p = D('Rellet广告工程/RELLET_HA_Spray_Ad_EN_9x16_28s.mp4')
if os.path.exists(p):
    add('rellet-ad', 'Skill 示例', 'RELLET 喷雾广告 28s', [version('最新版', [fmeta(p, '9:16')])], '实拍 + AI 补拍 Hybrid Reel')

# ---------------- 博客视频 ----------------
SKIP = re.compile(r'(raw|test|_src|^s\d|^r\d|^clip|^seg)', re.I)
for day in sorted(glob.glob(D('BuzzVideo博客工程/daily/2026-*'))):
    for topic in sorted(glob.glob(os.path.join(day, '*'))):
        if not os.path.isdir(topic) or os.path.basename(topic).startswith('_'):
            continue
        vids = [p for p in videos_in(topic) if not SKIP.search(os.path.basename(p))]
        if not vids:
            continue
        main = [p for p in vids if '_web' not in p]
        files = [fmeta(p, '原版' if '_web' not in p else '网页压缩版') for p in (main + [p for p in vids if '_web' in p])]
        add('blog-' + os.path.basename(topic), '博客视频', os.path.basename(topic), [version(os.path.basename(day), files)], '每日博客配图视频')

# ---------------- posters + output ----------------
os.makedirs(POSTERS, exist_ok=True)
urls = json.load(open(URLS)) if os.path.exists(URLS) else {}
for f in films:
    main = next(v for v in f['versions'] if v['files'])['files']
    src = min(main, key=lambda x: x['size'])['path']  # smallest file of the latest version is fastest to grab a frame from
    poster = os.path.join(POSTERS, f['id'] + '.jpg')
    if not os.path.exists(poster) or os.path.getmtime(poster) < os.path.getmtime(src):
        dur = probe(src)['dur'] or 2
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(dur * 0.4), '-i', src, '-frames:v', '1',
                        '-vf', 'scale=640:-2', '-q:v', '4', poster], check=False)
    f['poster'] = f'/video-library/posters/{f["id"]}.jpg'
    f['updated'] = max(v['date'] for v in f['versions'] if v['files'])
    for v in f['versions']:
        for x in v['files']:
            key = hashlib.sha1(x['path'].encode()).hexdigest()[:12] + '/' + x['name']
            x['key'] = key
            x['url'] = urls.get(key)
            x['local'] = x.pop('path').replace(HOME, '~')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({'generated': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 'films': films}, open(OUT, 'w'), ensure_ascii=False, indent=1)
n = sum(len(v['files']) for f in films for v in f['versions'])
size = sum(x['size'] for f in films for v in f['versions'] for x in v['files'])
print(f'{len(films)} films, {n} files, {size / 1e9:.2f} GB, uploaded {sum(1 for f in films for v in f["versions"] for x in v["files"] if x["url"])}')
from collections import Counter
print(Counter(f['category'] for f in films))
