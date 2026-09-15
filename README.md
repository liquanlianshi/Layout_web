# 页面布局 · 交互式教学网站

中英双语页面布局课程。**纯静态站**：无后端、无数据库、无构建步骤。
七个章节，每章一套「讲解 / 关键代码 / 演示」三 tab，共 21 个可交互演示。

---

## 部署到服务器（Docker）

**目标服务器**：腾讯云轻量 · 首尔 · Ubuntu 24.04
`43.133.237.170` · 2 核 2G · 已放行 80/443

**镜像约 50 MB，容器常驻内存约 10 MB。**

---

### 一、登录服务器

```bash
ssh -i ~/.ssh/layout-course.pem ubuntu@43.133.237.170
```

> ⚠️ **用户名是 `ubuntu`，不是 `root`**。
> Ubuntu 云端镜像默认禁止 root 直连（`PermitRootLogin prohibit-password`），
> 且只允许密钥登录。用 `root` 会报 `Permission denied (publickey)`。

还没复制私钥的话，先在 Mac 上执行：

```bash
mkdir -p ~/.ssh
cp "/Users/lianshi/密钥/my_first_.pem" ~/.ssh/layout-course.pem
chmod 600 ~/.ssh/layout-course.pem
```

---

### 二、确认 Docker

```bash
docker --version && docker compose version
```

没装的话：

```bash
sudo apt-get update
curl -fsSL https://get.docker.com | sudo sh
sudo apt-get install -y docker-compose-plugin
sudo systemctl enable --now docker
```

---

### 三、拉取代码并部署

```bash
sudo -i                                    # 升权到 root，后面命令不用加 sudo

cd /opt
git clone https://github.com/liquanlianshi/Layout_web.git layout-course
cd layout-course

bash deploy.sh --check                     # 先体检，不改动任何东西
bash deploy.sh --ip                        # 正式部署（--ip 让容器对外监听 80）
```

> **`--ip` 必须加。** 不加的话默认只监听 `127.0.0.1:8080`，公网访问不到。

**期望结尾**：

```
==> 6/6 本机自测
  ✓ 首页 → 200
  ✓ 健康检查 → 200
  ✓ 第 3 章 → 200
  ✓ 不存在的页面 → 404
  ✓ gzip 生效：demos.js 44801 字节（未压缩 153722）
```

---

### 四、验证

```bash
# 服务器上：三层依次确认
docker compose ps                          # ① 容器 Up (healthy)
docker port layout-course                  # ② 端口映射 0.0.0.0:80->80
curl -I http://127.0.0.1/healthz           # ③ 本机能响应 200

# Mac 上：确认公网可达
curl -I http://43.133.237.170/healthz      # 期望 HTTP/1.1 200 OK
```

浏览器打开 **http://43.133.237.170/** 验收：

- [ ] 首页正常，导航、统计、案例演化演示都在
- [ ] 进任一章 →「演示」tab → **拖动滑块，读数实时变化**
- [ ] 右上角切 **EN** → 页面变英文 → 跳到下一章 **仍是英文**
- [ ] `Cmd + -` 缩到手机宽度 → **没有横向滚动条**
- [ ] `F12` 控制台 → **无红色报错、无 404**

---

### 五、更新网站内容

```bash
# Mac 上
cd /Users/lianshi/作业/可视化导论
git add -A && git commit -m "update" && git push

# 服务器上
cd /opt/layout-course
git pull
bash deploy.sh --update
```

> 静态资源有 7 天强缓存。自己要看新版本需 `Cmd + Shift + R` 强制刷新；
> 面向学生发布建议把 `docker/nginx.conf.template` 里的 `expires 7d` 改成 `expires 1h`。

---

### 六、配 HTTPS（需要域名）

证书不能签发给 IP，所以先解析域名：

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| A | `layout` | `43.133.237.170` |

然后**先把容器改回只监听本机**（否则 80 端口被占用，宿主机 nginx 起不来）：

```bash
cd /opt/layout-course
sed -i 's|"80:80"|"127.0.0.1:8080:80"|' docker-compose.yml
docker compose up -d
```

装 nginx 并反代：

```bash
apt-get install -y nginx

cat > /etc/nginx/sites-available/layout-course <<'EOF'
server {
    listen 80;
    server_name layout.example.com;         # ← 改成你的域名

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/layout-course /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

> 容器内已开 gzip，宿主机 nginx **不要**再压一遍，双重压缩浪费 CPU。

申请免费证书（90 天自动续期）：

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d layout.example.com
# 邮箱 → A 同意条款 → N 不订阅 → 选 2 把 HTTP 跳转到 HTTPS
```

---

### 七、常用运维命令

```bash
cd /opt/layout-course                      # 需要权限时先 sudo -i

docker compose logs -f --tail=100          # 实时日志
docker compose ps                          # 容器状态（期望 Up healthy）
docker compose restart                     # 重启
docker stats layout-course --no-stream     # 资源占用（约 10 MB）
docker image prune -f                      # 清理旧镜像层
df -h /                                    # 磁盘
```

---

## 部署排障

### `curl http://43.133.237.170/` 连不上

在服务器上按下面顺序逐层排查：

```bash
# ① 容器在跑吗
docker compose ps
# ② 端口怎么映射的
docker port layout-course
# ③ 本机能不能通
curl -I http://127.0.0.1:80/healthz
# ④ 有没有别的进程占用 80
ss -tlnp | grep ':80'
```

| 现象 | 原因 | 处理 |
|---|---|---|
| 秒拒 `Couldn't connect` | 没有进程监听 80 | 容器没起，或没加 `--ip` |
| 一直卡住无响应 | 云端防火墙丢包 | 控制台 → 防火墙 → 放行 HTTP(80) |
| 本机通、公网不通 | 只监听回环 | `bash deploy.sh --ip` |
| `permission denied` | 没升权 | `sudo -i` |

### 反代后 502 Bad Gateway

```bash
curl -I http://127.0.0.1:8080/          # 宿主机能否连到容器
```
不通 → 容器没起（`docker compose logs`）；
通了还 502 → nginx 配置问题（`nginx -t`、`tail -50 /var/log/nginx/error.log`）。

### `nginx -t` 报 `Address already in use`

80 端口被容器占了（跑过 `--ip`）。按第六节改回容器只监听本机。

### 健康检查一直 unhealthy

```bash
docker inspect layout-course --format '{{json .State.Health}}'
docker compose exec web wget -qO- http://127.0.0.1:80/healthz
```
`--start-period` 是 5 秒，刚启动时是 `starting`，等 30 秒再看。

### 访问任何页面都返回 403 Forbidden

容器内 nginx 的 worker 以 **nginx 用户（UID 101）** 运行，**不是 root**。
如果文件成了 `600`（只有属主可读），worker 读不到就会 403。

```bash
# 在服务器上检查
ls -l index.html                    # 应该是 -rw-r--r--

# 修复（在项目目录执行）
chmod -R a+rX .
bash deploy.sh --update
```

`deploy.sh` 与 `Dockerfile` 都已内置处理：

- `deploy.sh` 在构建前检查「其他用户」读位，发现问题会提示并自动修正
- `Dockerfile` 在构建阶段和最终镜像里各执行一次 `chmod -R a+rX`，
  所以**即使宿主机 umask 异常，镜像里的权限也一定是对的**

> 补充：`git` 只记录 `100644`（可执行文件 `100755`），不记录 `600`，
> 所以 `git clone` 到服务器后通常不会有这个问题。
> 只有用 `rsync` / `scp` 直接传文件时才容易踩到。

### 确认镜像内容是否干净

```bash
docker run --rm layout-course:latest ls -R /usr/share/nginx/html
docker run --rm layout-course:latest ls -l /usr/share/nginx/html/index.html
```
应该正好 14 个文件、**没有 `tools/`**，且权限显示 `-rw-r--r--`。

---

## 文件说明

### 网站本体（14 个，431 KB）—— 少了任何一个都会 404

```
index.html                首页
styles.css                全站设计系统
i18n.js                   双语引擎 + 语法高亮
site.js                   Tab 切换、滚动高亮、键盘快捷键
demos.js                  21 个可交互演示（真实 DOM 测量）
lesson-content.js         七章双语词库
extra-content.js          首页演示词条
lesson-01/index.html … lesson-07/index.html
```

### 部署（6 个）

| 文件 | 作用 |
|---|---|
| `Dockerfile` | 多阶段构建：阶段 1 校验文件，阶段 2 只拷 14 个文件进 nginx:alpine |
| `docker/nginx.conf.template` | 容器内 nginx 配置（gzip、缓存、安全头、健康检查） |
| `docker-compose.yml` | 只读根文件系统、能力裁剪、资源上限、日志轮转 |
| `.dockerignore` | 把 33 MB 无关文件挡在构建上下文外（构建上下文仅 434 KB） |
| `deploy.sh` | 一键部署：体检 → 构建 → 健康检查 → 自测（含 `--check` / `--ip` / `--update`） |

### 仓库维护

`.gitignore` — 排除截图、打包产物、密钥、系统文件。

> **注意**：`.gitignore` 管「不进 Git 仓库」，`.dockerignore` 管「不进 Docker 镜像」，两者不要搞混。
> `.dockerignore` **不能**排除 `docker/` 目录 —— Dockerfile 要从里面拷贝 nginx 模板。

---

## 本地预览（可选）

无需任何依赖，直接双击 `index.html` 即可。

或用本地服务器（更接近线上表现）：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```
