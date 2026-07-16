# 如何加入自己的照片

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

4. `top` 是照片上方的短句，`bottom` 是照片下方的说明，`alt` 用来描述照片内容。

支持常见的 `.jpg`、`.jpeg`、`.png`、`.webp` 文件。网页会自动把照片裁切到相框中；建议优先使用清晰的竖图或人物居中的照片。

卡片内容也在 `birthday-content.js` 的 `card` 区域修改，不需要编辑 HTML 或动画代码。
