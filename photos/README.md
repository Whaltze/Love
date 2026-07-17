# 如何加入自己的照片、动图和视频

1. 把照片复制到这个 `photos` 文件夹中，建议命名为：
   - `01.jpg`
   - `02.jpg`
   - `03.jpg`
   - ……
2. 打开项目根目录的 `birthday-content.js`。
3. 找到对应照片，把 `src: ""` 改成：

   ```js
   src: "./photos/01.jpg",
   ```

4. `top` 是素材上方的短句，`bottom` 是素材下方的说明，`alt` 用来描述内容。

支持常见的 `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif` 图片。GIF 会像普通照片一样加入照片流，并自动播放自身动画。

MP4 / WebM 视频也可以加入，并在照片墙内静音、循环播放：

```js
{
  src: "./photos/memory-video.mp4",
  type: "video",
  poster: "./photos/memory-video-cover.jpg", // 可选封面
  autoplay: true,
  loop: true,
  muted: true,
  alt: "一段生日视频回忆",
  top: "视频上方的短句。",
  bottom: "视频下方的说明。",
},
```

`type: "video"` 可以省略，程序会自动识别 `.mp4`、`.webm`、`.ogg` 等视频扩展名。浏览器通常只允许静音视频自动播放，所以照片墙视频请保留 `muted: true`；点击放大后可在播放器中手动打开声音。

网页默认把图片和视频裁切到相框中。如果不想裁切，可在该条素材中加入 `fit: "contain"`。

卡片内容也在 `birthday-content.js` 的 `card` 区域修改，不需要编辑 HTML 或动画代码。
