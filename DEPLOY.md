# 部署指南 / Deployment

本课程网站是**纯静态站点**：没有后端、没有数据库、没有构建步骤。
把几个文件传到服务器，用任意静态服务器指过去就能跑。

---

## 一、2 核 2G 够不够？

**结论：绰绰有余，实际上 1 核 512M 都够。**

原因是这个站不需要任何计算：

- 没有 Node/PHP/Python 进程常驻，没有数据库，没有服务端渲染
- 服务器只做一件事：把文件从磁盘读出来发出去
- 所有交互（21 个演示的实时测量）都在**访问者的浏览器里**运行

### 实际负载

| 项目 | 数值 |
|---|---|
| 部署包总大小 | **476 KB**（15 个文件） |
| 门户首页首次访问 | 331 KB → **105 KB**（gzip） |
| 一次完整学习（门户 + 7 章） | **≈ 220 KB**（gzip） |
| 单次请求 CPU 开销 | ≈ 0.1–0.5 ms |
| Nginx 常驻内存（2 worker） | ≈ 10–30 MB |

### 2 核 2G 能扛多少

按「每个页面 ≈ 220 KB、每次访问平均 2 秒内加载完」粗算：

| 指标 | 估算值 | 说明 |
|---|---|---|
| 每秒请求数 | 数百 ~ 数千 | 静态文件 + gzip，瓶颈在网卡不在 CPU |
| 同时在线（活跃） | 数百 ~ 上千 | 每个连接仅占几十 KB，2 GB 内存可支撑上万并发连接 |
| 日访问量 | **几万 ~ 十几万 PV** | 这是带宽和流量的上限，不是 CPU 的上限 |

真正的瓶颈通常有两个，都不是 CPU：

1. **出口带宽**。若服务器是 1 Mbps，一天最多送出约 10 GB，
   折合约 4.5 万 PV（按 gzip 后 220 KB/会话算）。**带宽比 CPU 更值得关心。**
2. **磁盘 I/O**。这个站太小（476 KB），Nginx 会直接命中页缓存，可忽略。

---

## 二、要传哪些文件

```
index.html
styles.css
i18n.js
site.js
demos.js
lesson-content.js
extra-content.js
lesson-01/index.html  …  lesson-07/index.html
```

**不需要传**（开发用，含 10 MB 截图）：

```
tools/          ← 验证脚本与截图
README.md       ← 可选
.DS_Store
```

打包命令（在项目根目录执行）：

```bash
# 只打包运行所需文件
tar -czf layout-course.tar.gz \
  index.html styles.css i18n.js site.js demos.js \
  lesson-content.js extra-content.js \
  lesson-0{1,2,3,4,5,6,7}/index.html
# 约 180 KB
```

---

## 三、Nginx 配置（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/layout-course;
    index index.html;

    # ① 开启 gzip：331 KB → 105 KB，效果最明显的一步
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/html text/css application/javascript image/svg+xml;

    # ② 缓存策略：内容更新靠文件名或手动刷新，所以 HTML 不缓存、静态资源长缓存
    location ~* \.(css|js)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
    location = /index.html { add_header Cache-Control "no-cache"; }
    location ~* /index\.html$ { add_header Cache-Control "no-cache"; }

    # ③ 安全响应头（静态站很便宜就能加上）
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # ④ 目录访问自动落到 index.html
    #    —— 注意：上一版链接写的是 ../lesson-03/ 这种目录形式，
    #    现在全部改成了显式 index.html，这一条只是兜底。
    location / { try_files $uri $uri/ $uri/index.html =404; }
}
```

上传与启用：

```bash
# 本地打包上传
scp layout-course.tar.gz user@your-server:/tmp/

# 服务器上解包
sudo mkdir -p /var/www/layout-course
sudo tar -xzf /tmp/layout-course.tar.gz -C /var/www/layout-course
sudo chown -R www-data:www-data /var/www/layout-course

# 放置站点配置并重载
sudo vim /etc/nginx/sites-available/layout-course   # 粘贴上面的配置
sudo ln -s /etc/nginx/sites-available/layout-course /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 四、HTTPS（免费，5 分钟）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
# certbot 会自动改写 nginx 配置并把 80 端口跳转到 443，证书自动续期
```

页面本身没有外部请求（字体走系统字体、图标是内联 SVG、无 CDN），
所以 **HTTPS 开启后不会有任何混合内容问题**，也不用额外配置 CSP 白名单。

---

## 五、更省事的替代方案

### Caddy（自动 HTTPS，配置只有 2 行）

```bash
# Caddyfile
your-domain.com {
    root * /var/www/layout-course
    encode gzip
    file_server
}
```

Caddy 会自动申请并续期证书，适合不想折腾证书的场景。
内存占用约 30–50 MB，2G 服务器完全无压力。

### 只做临时演示

```bash
cd /var/www/layout-course
python3 -m http.server 8000
# 不建议长期使用：单线程、无 gzip、无缓存头
```

### 最省服务器：对象存储 + CDN

这个站是全静态的，其实**可以不买服务器**：把文件丢到对象存储
（阿里云 OSS / 腾讯云 COS / Cloudflare R2），开启静态网站托管 + CDN。
成本通常比一台云服务器低一个数量级，而且抗流量能力更强。
只有当你需要自定义域名 + 备案 + 更细的控制时才需要独立服务器。

---

## 六、如果要放在中国大陆的服务器上

需要 **ICP 备案**，否则域名会被拦截：

1. 域名需先实名认证
2. 在服务器提供商处提交备案（阿里云/腾讯云等），通常 7–20 个工作日
3. 备案期间服务器 IP 可以直接访问（不经域名），可用于内测
4. 备案通过后绑定域名并开启 HTTPS

如果是**校园内网/教学演示**用途，直接给 IP 访问即可，不需要备案。

---

## 七、部署后自测

本仓库自带无头浏览器验证脚本，可以直接打线上地址：

```bash
# 在本地（有 tools/ 的机器上）执行，检查线上站点
node tools/probe.mjs \
  https://your-domain.com/index.html \
  https://your-domain.com/lesson-01/index.html \
  https://your-domain.com/lesson-07/index.html
```

它会输出每个页面的 **JS 错误数、21 个演示的实时读数值、iframe 可访问性**，
并在 `tools/shots/` 留下截图。全部显示 `JS errors: none` 且 `RESULT: all clean` 即为正常。

### 上线检查清单

- [ ] `gzip_types` 里包含 `application/javascript`（否则 demos.js 仍传 150 KB）
- [ ] 随便打开一章，点「演示」tab，拖动滑块看读数是否实时变化
- [ ] 中英切换后跳转下一章，语言是否保持（走 `?lang=` 参数）
- [ ] 手机宽度下无横向滚动条
- [ ] 控制台无 404（尤其 favicon 与 .js 文件）

---

## 八、性能优化（可选）

站点已经足够小，以下都是锦上添花：

1. **合并 JS**：`i18n.js + lesson-content.js + extra-content.js` 可合并成一个词库包，
   减少 2 次请求（但会牺牲「改词条不用重发引擎」的清晰分层）
2. **HTTP/2**：Nginx 开启后多路复用，7 个请求的开销基本消失
   ```nginx
   listen 443 ssl http2;
   ```
3. **Brotli**：比 gzip 再小 15–20%（`ngx_brotli` 模块）
4. **给 HTML 加 `Cache-Control: no-cache` 而不是 `no-store`**，
   这样浏览器会发条件请求，未更新时返回 304，几乎不耗流量
