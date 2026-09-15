# Docker 部署指南 / Docker Deployment

> 如果你要的是「从零开始、一步步在腾讯云轻量上做完」的实操手册，
> 见 **[SERVER-SETUP.md](SERVER-SETUP.md)**（含控制台操作、防火墙放行、绑域名与证书）。
> 本文讲的是 Docker 打包本身的原理与配置，以及通用运维与排障。

把本站打包成镜像发到自己的服务器上运行。
**结论先行**：最终镜像约 50 MB（几乎全是 nginx:alpine 本身），
容器常驻内存约 10 MB，2 核 2G 的机器跑它基本是空闲状态。

---

## 一、仓库里已备好的文件

| 文件 | 作用 |
|---|---|
| `Dockerfile` | 多阶段构建：阶段 1 校验静态文件，阶段 2 只拷贝这 14 个文件进 nginx:alpine |
| `docker/nginx.conf.template` | 容器内站点配置，启动时按环境变量渲染（可改端口） |
| `docker-compose.yml` | 一键起停，含只读根文件系统、资源上限、健康检查 |
| `.dockerignore` | 把 `v2.zip`(23MB)、`tools/` 截图(10MB)、`.git` 挡在构建上下文之外 |

构建上下文因此只有 **431 KB / 14 个文件**。

---

## 二、服务器上需要什么

```bash
# 安装 Docker（以 Ubuntu/Debian 为例）
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # 免 sudo，需重新登录生效

# 若要用 docker compose（推荐）
sudo apt install -y docker-compose-plugin

docker --version && docker compose version
```

---

## 三、把代码送上服务器

任选一种。

### 方式 A：用 git（推荐，后续更新最省事）

```bash
# 服务器上
git clone <你的仓库地址> layout-course
cd layout-course
```

### 方式 B：直接 scp 源码

```bash
# 本地执行；注意带上 Dockerfile 与 docker/ 目录
rsync -av --exclude '.git' --exclude 'tools' --exclude '*.zip' \
  ./ user@your-server:~/layout-course/
```

> **不要**把 `v2.zip` 和 `tools/` 传上去。`.dockerignore` 会让它们不进镜像，
> 但传上去仍然白占服务器磁盘和传输时间。

---

## 四、起服务

```bash
cd layout-course

# 构建 + 后台启动
docker compose up -d --build

# 看状态（等几秒让健康检查跑一次）
docker compose ps
# NAME            STATUS                    PORTS
# layout-course   Up (healthy)              127.0.0.1:8080->80/tcp

# 验证
curl -I http://127.0.0.1:8080/
curl http://127.0.0.1:8080/healthz     # → ok
```

`docker-compose.yml` 默认只监听 **127.0.0.1:8080**，即只对本机开放。
这样做的前提是你前面还有一个 nginx/Caddy 做 HTTPS 和域名。
**如果你的服务器上不打算装宿主机 nginx**，把端口改成对外：

```yaml
    ports:
      - "80:80"      # 直接对外，改完 docker compose up -d
```

---

## 五、配 HTTPS（两种常见做法）

### 做法 1：宿主机 nginx 反代（推荐，证书管理最灵活）

```nginx
# /etc/nginx/sites-available/layout-course
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/layout-course /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com     # 自动配好 443 与续期
```

> 容器内已经开了 gzip，宿主机 nginx **不需要**再压一遍，
> 否则会双重压缩浪费 CPU。若宿主机也想开，记得加 `proxy_set_header Accept-Encoding "";`。

### 做法 2：Caddy 自动 HTTPS（配置最短）

```caddyfile
your-domain.com {
    reverse_proxy 127.0.0.1:8080
}
```

Caddy 会自动申请并续期证书，无需 certbot。

---

## 六、日常运维

```bash
# 看日志（访问日志与错误日志都走 stdout/stderr）
docker compose logs -f --tail=100

# 重启 / 停止 / 删除
docker compose restart
docker compose down
docker compose down --rmi local      # 连镜像一起删

# 进容器看看（镜像里没有 shell 之外的工具，但能确认文件在）
docker compose exec web ls -la /usr/share/nginx/html

# 资源占用
docker stats layout-course --no-stream
```

### 更新站点内容

因为静态资源设了 7 天强缓存，**内容更新靠重建镜像**：

```bash
git pull                              # 或重新 rsync
docker compose up -d --build          # 重建并滚动替换
docker image prune -f                 # 清掉悬空旧层
```

重建后 JS/CSS 的文件名没变，浏览器可能仍用旧缓存（最多 7 天）。
两种情况处理方式不同：

- **自己测试**：`Cmd/Ctrl + Shift + R` 强制刷新
- **面向学生发布**：把 `docker/nginx.conf.template` 里静态资源的
  `expires 7d` 改成 `expires 1h`，或给资源名加版本号（如 `demos.js?v=2`）

---

## 七、如果服务器不能联网 / 不想在服务器上构建

在本地构建好，导出镜像文件传过去：

```bash
# 本地
docker build -t layout-course:latest .
docker save layout-course:latest | gzip > layout-course-image.tar.gz   # 约 20 MB

# 传过去
scp layout-course-image.tar.gz docker-compose.yml user@your-server:~/

# 服务器上（compose 里已有 image: layout-course:latest，
# 需要把 build: . 注释掉，避免它尝试重新构建）
gunzip -c layout-course-image.tar.gz | docker load
docker compose up -d
```

服务器是 x86_64 而你在 Apple Silicon 上构建时，要指定平台：

```bash
docker build --platform linux/amd64 -t layout-course:latest .
```

---

## 八、容器做了什么加固

`docker-compose.yml` 里已经配好，都是静态站的零成本加固：

| 配置 | 作用 |
|---|---|
| `read_only: true` | 根文件系统只读，容器被攻破也改不了文件 |
| `tmpfs` 三处 | nginx 需要写的 pid/缓存/临时目录走内存 |
| `cap_drop: ALL` + 按需 `cap_add` | 只保留绑定端口与切换用户所需的能力 |
| `no-new-privileges: true` | 禁止提权 |
| `cpus: 1.0` / `memory: 128M` | 异常流量不会拖垮小机器 |
| `logging` 上限 10MB×3 | 日志不会撑爆磁盘 |
| `restart: unless-stopped` | 崩溃/重启后自动拉起 |

`X-Content-Type-Options`、`Referrer-Policy` 等安全头在
`docker/nginx.conf.template` 里已配置。

> **注意**：没有加 `X-Frame-Options` / `frame-ancestors`。
> 站内 21 个演示用 `iframe[srcdoc]` 承载，加了会直接白屏。

---

## 九、上线自测

```bash
# ① 容器健康状态
docker compose ps                       # 期望 (healthy)

# ② 关键响应
curl -sI  https://your-domain.com/               | head -1   # 200
curl -s   https://your-domain.com/healthz                    # ok

# ③ gzip 是否生效（demos.js 应压到 ~44KB）
curl -sI -H 'Accept-Encoding: gzip' https://your-domain.com/demos.js \
  | grep -i content-encoding                                 # gzip

# ④ 用仓库自带的无头浏览器脚本做完整回归
#    在本地（有 tools/ 的机器）跑，指向线上地址
node tools/probe.mjs https://your-domain.com/index.html \
                     https://your-domain.com/lesson-04/index.html
```

`probe.mjs` 会输出每个页面的 **JS 错误数、21 个演示的实时读数值、iframe 可访问性**，
预期全部 `JS errors: none` 且 `RESULT: all clean`。

### 检查清单

- [ ] `docker compose ps` 显示 `(healthy)`
- [ ] 首页、任一章、演示 tab 切换正常，滑块拖动后读数实时变化
- [ ] 中英切换后跳下一章，语言保持（URL 带 `?lang=`）
- [ ] 手机宽度无横向滚动条
- [ ] 浏览器控制台无 404、无报错
- [ ] `curl -sI` 能看到 `Content-Encoding: gzip`

---

## 十、两个容易踩的坑

**① 健康检查定义在 Dockerfile，不在 compose 里**

`HEALTHCHECK` 写在 `Dockerfile` 里，compose 会自动继承，
所以你在 `docker-compose.yml` 里看不到 `healthcheck:` 段落——这是故意的，不是漏了。
它探测的 `/healthz` 与 `listen ${NGINX_PORT}` 用的是**同一个环境变量**，
所以你改端口时健康检查会一起跟着变，不会失配。

**② 改文件名必须同步改 Dockerfile**

`Dockerfile` 里的 `COPY` 是**白名单**，一个文件一行。
如果你新增或重命名了页面（比如加了 `lesson-08/`），
必须同时加一行 `COPY lesson-08/index.html ./lesson-08/`，
否则构建虽然成功，但线上会 404。
好在构建阶段 1 有一道校验，缺文件会直接让 `docker build` 失败：

```
缺少文件: lesson-08/index.html
```

也就是说**错误会在构建时暴露，而不是上线后**。

---

## 十一、疑难排查

**容器起来了但访问 502**
宿主机 nginx 反代时用了容器名而不是端口。默认 compose 没有共享网络，
用 `proxy_pass http://127.0.0.1:8080;` 即可。

**端口被占用**
```bash
sudo lsof -i :8080     # 看谁占了
# 或改 compose 里的映射，例如 "127.0.0.1:8081:80"
```

**健康检查一直 unhealthy**
```bash
docker compose exec web wget -qO- http://127.0.0.1:80/healthz
```
若手动能通但状态仍是 unhealthy，多半是 `NGINX_PORT` 被改过而健康检查没跟着改
（healthcheck 用的是同一个 `${NGINX_PORT}`，改端口时会一起生效）。

**改了配置没生效**
`docker compose restart` 不会重新渲染模板？会。但 `docker compose up -d` 之后
若镜像没重建，容器内文件仍是旧的 —— 用 `docker compose up -d --build`。

**想确认镜像里到底有什么**
```bash
docker run --rm layout-course:latest ls -R /usr/share/nginx/html
```
应该正好 14 个文件，没有 `tools/`、没有 `v2.zip`。
