#!/bin/zsh
# 生成 BuzzVideo APP 原型的演示素材:Seedream 5.0 出图,Seedance 2.0 首帧生视频。
# 用法:zsh scripts/gen-buzzvideo-app-assets.sh [images|videos|all]
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/prototypes/buzzvideo-app"
mkdir -p "$OUT"
set -a; source "$ROOT/.env.local"; set +a
H=${BYTEPLUS_ARK_HOST:-https://ark.ap-southeast.bytepluses.com}
AUTH="Authorization: Bearer $BYTEPLUS_ARK_API_KEY"
NO_TEXT="No text, no letters, no logos, no watermark."
TALL="1440x2560"; WIDE="2304x1728"; SQUARE="1920x1920"

img() { # name size prompt
  local name=$1 size=$2 prompt="$3 $NO_TEXT"
  [[ -f "$OUT/$name.jpg" ]] && { echo "skip $name"; return; }
  local body url
  body=$(jq -n --arg p "$prompt" --arg s "$size" '{model:"seedream-5-0-260128",prompt:$p,size:$s,response_format:"url",watermark:false}')
  url=$(curl -s -m 240 "$H/api/v3/images/generations" -H "$AUTH" -H "Content-Type: application/json" -d "$body" | jq -r '.data[0].url // empty')
  [[ -z "$url" ]] && { echo "FAIL $name"; return 1; }
  curl -s -o "$OUT/$name.src.jpg" "$url"
  sips -Z 1280 -s format jpeg -s formatOptions 72 "$OUT/$name.src.jpg" --out "$OUT/$name.jpg" >/dev/null
  rm "$OUT/$name.src.jpg"; echo "ok $name"
}

video() { # name first-frame-jpg prompt
  local name=$1 frame=$2 prompt=$3
  [[ -f "$OUT/$name.mp4" ]] && { echo "skip $name"; return; }
  local b64 body id st vurl
  b64="data:image/jpeg;base64,$(base64 -i "$OUT/$frame")"
  body=$(jq -n --arg p "$prompt" --arg u "$b64" '{model:"dreamina-seedance-2-0-260128",content:[{type:"text",text:$p},{type:"image_url",image_url:{url:$u},role:"first_frame"}],ratio:"9:16",duration:5,resolution:"720p",generate_audio:false,watermark:false}')
  id=$(curl -s -m 60 "$H/api/v3/contents/generations/tasks" -H "$AUTH" -H "Content-Type: application/json" -d "$body" | jq -r '.id // empty')
  [[ -z "$id" ]] && { echo "FAIL $name (create)"; return 1; }
  echo "task $name $id"
  while true; do
    sleep 15
    st=$(curl -s "$H/api/v3/contents/generations/tasks/$id" -H "$AUTH")
    case $(echo "$st" | jq -r .status) in
      succeeded) vurl=$(echo "$st" | jq -r .content.video_url); break ;;
      failed) echo "FAIL $name: $(echo "$st" | jq -c .error)"; return 1 ;;
    esac
  done
  curl -s -o "$OUT/$name.src.mp4" "$vurl"
  ffmpeg -y -loglevel error -i "$OUT/$name.src.mp4" -an -vf "scale=720:-2" -c:v libx264 -crf 27 -preset slow -movflags +faststart "$OUT/$name.mp4"
  rm "$OUT/$name.src.mp4"; echo "ok $name"
}

images() {
  img usecase-latte $TALL "Vertical commercial photo: iced latte in a tall clear glass, milk swirling into espresso over ice, sunlit wooden cafe counter, warm morning light, shallow depth of field, premium ad look." &
  img usecase-skincare $TALL "Vertical beauty ad photo: glass dropper serum bottle standing on wet stone, soft peach light, water droplets, luxury skincare mood." &
  img usecase-sneaker $TALL "Vertical streetwear ad photo: white and orange sneaker floating mid-air above a city street at dusk, motion blur, dynamic." &
  img usecase-bakery $TALL "Vertical food photo: fresh croissants and pastries on a bakery counter at sunrise, light steam, baker's hands placing a tray." &
  wait
  img usecase-lipstick $TALL "Vertical beauty macro photo: lip tint swatches on skin next to open lip tint tubes, soft pink and coral tones." &
  img usecase-opening $TALL "Vertical photo: small boutique storefront grand opening with balloons and a ribbon, busy Hong Kong street at evening, warm shop lights." &
  img usecase-florist $TALL "Vertical photo: florist arranging a bouquet of peonies and tulips in a pastel flower shop, soft daylight." &
  img usecase-ramen $TALL "Vertical food photo: steaming bowl of ramen with chashu and soft egg on a dark wooden table, moody warm light." &
  wait
  img banner-seedance $WIDE "Cinematic still of a dancer mid-spin at golden hour with flowing fabric and motion trails, warm orange tones, generous empty space on the left side." &
  img banner-audio $WIDE "Studio microphone with warm orange backlight and soft bokeh sound-wave lights, dark warm background, empty space on the left side." &
  img banner-templates $WIDE "Cozy autumn cafe table flat lay with coffee cup, pastry and maple leaves, warm light, empty space on the left side." &
  img camera-view $TALL "Phone camera point-of-view photo of a cafe table with an iced latte and a croissant, natural window light, casual snapshot." &
  wait
  img photo-1 $TALL "Casual smartphone snapshot of a cafe counter with espresso machine, natural light." &
  img photo-2 $TALL "Casual smartphone snapshot, top-down view of an iced latte on a marble table." &
  img photo-3 $TALL "Casual smartphone snapshot of a barista pouring milk into a cup, cafe background." &
  img photo-4 $TALL "Casual smartphone snapshot of a small cafe storefront exterior on a sunny day." &
  wait
  img photo-5 $TALL "Casual smartphone snapshot of a pastry display case in a cafe." &
  img photo-6 $TALL "Casual smartphone snapshot: flat lay of a coffee bean bag with a blank label and a scoop." &
  img photo-7 $TALL "Casual smartphone snapshot of two friends chatting at a cafe window seat, candid." &
  img photo-8 $TALL "Casual smartphone snapshot, close-up of latte art in a ceramic cup." &
  wait
  img result-agent $TALL "Vertical premium ad frame: milk being poured into an iced latte, sunlit cafe window, bold centered composition, commercial quality." &
  img result-image $TALL "Vertical product hero photo: boutique shopping bag with fresh flowers on a pastel pedestal, clean studio light, commercial." &
  img result-video $TALL "Vertical cinematic frame: glass serum bottle on wet stone with soft peach light and water droplets, commercial quality." &
  img result-audio $TALL "Abstract warm orange sound wave visualization on a soft cream background, minimal, elegant." &
  img avatar $SQUARE "Friendly headshot portrait of a young Asian creative professional smiling, soft natural light, plain warm background." &
  wait
}

videos() {
  video result-agent result-agent.jpg "The milk slowly pours into the iced latte and swirls through the espresso, ice glistens, slow push-in, warm morning light." &
  video result-video result-video.jpg "The serum bottle slowly rotates on the wet stone, water droplets glisten, soft light sweeps across, slow camera orbit." &
  wait
}

case ${1:-all} in
  images) images ;;
  videos) videos ;;
  all) images; videos ;;
esac
ls -la "$OUT"
