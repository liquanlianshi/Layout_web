# 服务器部署详细步骤（腾讯云轻量 · 首尔 · Ubuntu 24.04）

针对你这台机器的实操手册，每一步都写明**做什么、为什么、期望看到什么**。

---

## ⚠️ 先纠正一个关键点：登录用 `ubuntu`，不是 `root`

我上一版文档里写的 `ssh root@43.133.237.170` 是错的，抱歉。

原因：**Ubuntu 云端镜像默认禁用 root 的 SSH 登录**，只提供一个 `ubuntu` 用户，
并且**只允许密钥登录**（不是密码）。很多教程写 `ssh root@...`，
那是 CentOS / Debian 镜像或腾讯云 CVM 的做法，**不适用于 Ubuntu 轻量**。

| 项目 | 错误写法 ❌ | 正确写法 ✅ |
|---|---|---|
| 用户名 | `root` | **`ubuntu`** |
| 认证方式 | 密码 | **私钥**（`-i 路径`） |
| 登录命令 | `ssh root@43.133.237.170` | `ssh -i ~/.ssh/layout-course.pem ubuntu@43.133.237.170` |

---

## 你的服务器信息

| 项目 | 值 | 说明 |
|---|---|---|
| 操作系统 | **Ubuntu Server 24.04 LTS** | 登录用户是 `ubuntu` |
| 登录方式 | **SSH 私钥** | `/Users/lianshi/密钥/my_first_.pem`（已验证可用） |
| 公网 IPv4 | **43.133.237.170** | 后面到处要用 |
| 地域 | 首尔 · 首尔二区 | **境外，不需要 ICP 备案** |
| 规格 | 2 核 / 2 GB / 40 GB SSD | 对本站远远过剩 |
| 峰值带宽 | 20 Mbps | 真正的瓶颈，约 2.5 MB/s；单页 gzip 后 105 KB |
| 流量包 | 512 GB / 月 | 约合 240 万次完整学习，够用 |
| 镜像 | Docker CE-vnsv | **很可能已预装 Docker**，第 2 步确认 |
| 到期 | 2026-10-14 | 到期前记得续费，否则服务停 |

> **首尔地域的好处**：不用备案，今天买今天就能绑域名上 HTTPS。
> **代价**：中国大陆访问延迟约 30–80 ms，可接受。

---

## 第 0 步：把私钥放到标准位置（建议，5 秒）

腾讯云把密钥下载到了 `/Users/lianshi/密钥/my_first_.pem`。
这个路径**能用**（我已验证：RSA 2048、权限 600、格式正确），
但路径含中文，后面写命令容易出错。建议复制到 `~/.ssh/`：

```bash
# 在 Mac 的终端执行
mkdir -p ~/.ssh
cp "/Users/lianshi/密钥/my_first_.pem" ~/.ssh/layout-course.pem
chmod 600 ~/.ssh/layout-course.pem
ls -l ~/.ssh/layout-course.pem
```

**期望输出**：`-rw-------@ 1 lianshi staff 1674 ... /Users/lianshi/.ssh/layout-course.pem`

<details>
<summary>不想复制？直接用原路径也行</summary>

把后面所有 `~/.ssh/layout-course.pem` 替换成 `"/Users/lianshi/密钥/my_first_.pem"`
（**注意加引号**，路径含中文）。
</details>

> **为什么必须 `chmod 600`？** SSH 对私钥权限很挑剔，
> 同组或其他用户可读时会直接拒绝使用并报
> `WARNING: UNPROTECTED PRIVATE KEY FILE!`。你现在的文件已是 600，无需处理。

---

## 第 1 步：登录服务器

打开 Mac 的「终端」：

```bash
ssh -i ~/.ssh/layout-course.pem ubuntu@43.133.237.170
```

- 第一次连接会问 `Are you sure you want to continue connecting?` → 输入 `yes` 回车
- **不需要输密码**（密钥认证）

**成功的标志**：提示符变成

```
ubuntu@VM-4-13-ubuntu:~$
```

> 建议加个别名，以后 `ssh layout` 一句登录。在 **Mac** 上执行：
> ```bash
> cat >> ~/.ssh/config <<'EOF'
> Host layout
>   HostName 43.133.237.170
>   User ubuntu
>   IdentityFile ~/.ssh/layout-course.pem
>   ServerAliveInterval 60
> EOF
> chmod 600 ~/.ssh/config
> ```
> 之后直接 `ssh layout`。

### 为什么 root 会被拒绝？

Ubuntu 云端镜像的 `/etc/ssh/sshd_config` 里有：

```
PermitRootLogin prohibit-password
```

且 root 没有设置密码，所以任何形式的 root 直连都会被拒。
**要 root 权限的正确做法是：先用 `ubuntu` 登录，再升权。**

```bash
sudo -i          # 切到 root shell（提示符变 root@...），之后命令无需加 sudo
# 或者单条命令加 sudo：  sudo apt-get update
```

**本手册后面的命令，都假设你已登录并执行了 `sudo -i`**，
所以命令里不再逐个加 `sudo` —— 这样最省事，也不容易漏。

> 登录后先确认身份：
> ```bash
> whoami            # ubuntu
> sudo -i
> whoami            # root  ← 看到这个就对了
> ```

---

## 第 2 步：确认系统与 Docker

```bash
cat /etc/os-release | head -3
docker --version
docker compose version
```

**期望输出**（数字可能不同）：

```
PRETTY_NAME="Ubuntu 24.04 LTS"
...
Docker version 27.3.1, build ce12230
Docker Compose version v2.29.7
```

### 如果 `docker: command not found`

```bash
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin
systemctl enable --now docker
docker --version && docker compose version
```

### 如果只有 `docker` 没有 `docker compose`

```bash
apt-get update && apt-get install -y docker-compose-plugin
```

### 如果提示 `permission denied`

你还没升权。先 `sudo -i`，或命令前加 `sudo`。

> 可选：更新系统补丁（约 1 分钟）
> ```bash
> apt-get update && apt-get upgrade -y
> ```

---

## 第 3 步：把代码传到服务器

**回到 Mac 的终端**（新开窗口，别退出 SSH 那个）。

项目里有个 23 MB 的 `v2.zip` 和 10 MB 的验证截图，**不要传**：

```bash
cd /Users/lianshi/作业/可视化导论

tar -czf /tmp/layout-course.tar.gz \
  index.html styles.css i18n.js site.js demos.js \
  lesson-content.js extra-content.js \
  lesson-01/index.html lesson-02/index.html lesson-03/index.html \
  lesson-04/index.html lesson-05/index.html lesson-06/index.html \
  lesson-07/index.html \
  Dockerfile docker-compose.yml .dockerignore deploy.sh \
  docker/nginx.conf.template

ls -lh /tmp/layout-course.tar.gz     # 应约 130 KB
```

上传（**用户名是 `ubuntu`，目标路径 `/home/ubuntu/`**）：

```bash
scp -i ~/.ssh/layout-course.pem /tmp/layout-course.tar.gz ubuntu@43.133.237.170:/home/ubuntu/
```

**成功的标志**：

```
layout-course.tar.gz                    100%  128KB   1.2MB/s   00:00
```

> `ubuntu` 用户对自己的家目录有写权限，所以上传**不要加 sudo**（加了反而失败）。

> 若项目在 GitHub/Gitee，可跳过这步，在服务器上 `git clone`。

---

## 第 4 步：在服务器上解包并部署

**回到 SSH 窗口**：

```bash
# 升权到 root（后面命令都不用加 sudo）
sudo -i

# 解包到 /opt/layout-course
mkdir -p /opt/layout-course
tar -xzf /home/ubuntu/layout-course.tar.gz -C /opt/layout-course
cd /opt/layout-course

# 先做环境检查（不改动任何东西）
bash deploy.sh --check
```

**期望输出**：

```
==> 1/6 检查环境
  ✓ 系统：Ubuntu 24.04 LTS
  ✓ 架构：x86_64
  ✓ 架构 x86_64：可用官方 nginx 镜像
  ✓ 内存：1983 MB
==> 2/6 检查 Docker
  ✓ docker 已安装：Docker version 27.3.1
  ✓ docker compose：Docker Compose version v2.29.7
==> 3/6 检查站点文件
  ✓ 全部 17 个必要文件就位
==> 4/6 选择对外端口
  ✓ 当前映射："127.0.0.1:8080:80"
==> 检查完毕（--check 模式，未做改动）
```

正常后正式部署：

```bash
bash deploy.sh
```

脚本会依次：构建镜像 → 启动容器 → 等健康检查 → 本机自测。

**期望结尾**：

```
==> 6/6 本机自测
  ✓ 首页 → 200
  ✓ 健康检查 → 200
  ✓ 第 3 章 → 200
  ✓ 不存在的页面 → 404
  ✓ gzip 生效：demos.js 44801 字节（未压缩 153722）
```

### 现在容器只监听本机。想用公网 IP 直接看，执行这一条

```bash
bash deploy.sh --ip        # 映射改成 80:80，直接对外
```

然后**必须**去控制台放行 80 端口（第 5 步）。

### 或者：不暴露任何端口，在自己电脑上安全预览

**在 Mac 终端**执行（保持窗口开着）：

```bash
ssh -i ~/.ssh/layout-course.pem -L 8080:127.0.0.1:8080 ubuntu@43.133.237.170
```

然后 Mac 浏览器打开 `http://localhost:8080/` —— 看到的就是服务器上跑的真实站点，
外网完全访问不到。适合先验收再公开。

---

## 第 5 步：在腾讯云控制台放行端口（**最容易漏的一步**）

腾讯云轻量有**独立的云端防火墙**，默认只开 22（SSH）。
服务器内部的 `ufw` / `iptables` 全放开也没用，**不在控制台放行就连不上**。

1. 控制台 → 你的实例 → 左侧 **「防火墙」**
2. 点 **「添加规则」**
3. 添加：

| 应用类型 | 协议 | 端口 | 来源 | 用途 |
|---|---|---|---|---|
| HTTP | TCP | 80 | 全部 IPv4 (0.0.0.0/0) | 网站访问 + 申请证书 |
| HTTPS | TCP | 443 | 全部 IPv4 (0.0.0.0/0) | 加密访问（可选） |

4. 保存

> ⚠️ **22 端口千万别删或改成"全部"**，那是 SSH，删了你就登不进去了。

验证（在 **Mac** 上执行）：

```bash
curl -I http://43.133.237.170/healthz
```

| 结果 | 含义 |
|---|---|
| `HTTP/1.1 200 OK` | ✅ 通了 |
| `Connection refused` | 端口没放行，或容器没监听 80（跑过 `--ip` 吗？） |
| 一直卡住无响应 | 云端防火墙没放行（被丢包） |

---

## 第 6 步：绑域名 + HTTPS（推荐）

### 6.1 解析域名

在域名服务商（DNSPod / 阿里云 / Cloudflare）添加 A 记录：

| 类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| A | `layout`（或 `@` 主域） | `43.133.237.170` | 600 |

验证（Mac 上，可能等几分钟）：

```bash
ping layout.example.com -c 3      # 应显示 43.133.237.170
```

### 6.2 装宿主机 nginx 并配置反代

**回到 SSH 窗口**（确保还在 `sudo -i` 的 root shell）：

```bash
apt-get install -y nginx

cat > /etc/nginx/sites-available/layout-course <<'EOF'
server {
    listen 80;
    server_name layout.example.com;      # ← 改成你的实际域名

    location / {
        proxy_pass http://127.0.0.1:8080;   # 指向 Docker 容器
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

> ⚠️ 若之前跑过 `bash deploy.sh --ip`（映射成 `80:80`），
> **80 端口已被容器占用**，宿主机 nginx 会启动失败。先改回只监听本机：
> ```bash
> cd /opt/layout-course
> sed -i 's|"80:80"|"127.0.0.1:8080:80"|' docker-compose.yml
> docker compose up -d
> ```

> **不要**在宿主机 nginx 里再开 gzip，容器内已开，双重压缩浪费 CPU。

现在用域名应该能打开了：`http://layout.example.com/`

### 6.3 申请免费证书，自动开启 HTTPS

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d layout.example.com
```

按提示：

1. 输入邮箱（证书过期提醒）
2. 同意条款输 `A`，订阅邮件输 `N`
3. 是否把 HTTP 跳转到 HTTPS → **选 2（Redirect）**

**证书 90 天自动续期**，无需干预。验证：

```bash
curl -I https://layout.example.com/healthz     # HTTP/2 200
```

浏览器打开会看到地址栏的 🔒。

---

## 第 7 步：验收

```bash
# ① 容器状态（服务器上）
cd /opt/layout-course
docker compose ps
# 期望：Up (healthy)

# ② 资源占用 —— 看看它有多省
docker stats layout-course --no-stream
# 期望：CPU 0.0% 左右，内存约 10 MB

# ③ 线上回归测试（在 Mac 上，用仓库自带脚本）
cd /Users/lianshi/作业/可视化导论
node tools/probe.mjs https://layout.example.com/index.html
# 期望：JS errors: none，RESULT: all clean
```

浏览器逐项确认：

- [ ] 首页正常，导航、统计数字、案例演化演示都在
- [ ] 进任一章 →「演示」tab → 拖滑块 → **读数实时变化**
- [ ] 右上角切 EN → 页面变英文 → 跳到下一章 **仍是英文**
- [ ] `Cmd + -` 缩到手机宽度 → **没有横向滚动条**
- [ ] `F12` 控制台 → **无红色报错、无 404**

---

## 日常维护

```bash
cd /opt/layout-course          # 需要 root 权限时先 sudo -i

docker compose logs -f --tail=100        # 看日志
docker compose restart                   # 重启
docker compose down                      # 停止
docker stats layout-course --no-stream   # 资源占用
df -h /                                  # 磁盘
docker system df                         # Docker 占用
docker image prune -f                    # 清理无用镜像层
```

### 更新网站内容

Mac 上重新打包上传，然后服务器上：

```bash
cd /opt/layout-course
tar -xzf /home/ubuntu/layout-course.tar.gz -C /opt/layout-course
bash deploy.sh --update
```

> 静态资源有 7 天强缓存，更新 CSS/JS 后自己要看新版需 `Cmd + Shift + R`。
> 面向学生发布建议把 `docker/nginx.conf.template` 里的 `expires 7d` 改成 `expires 1h`。

---

## 排障

**1. `ssh` 报 `Permission denied (publickey)`** ← 你刚遇到的

逐项核对：

- 用户名是 **`ubuntu`**，不是 `root`（**最常见原因**）
- 是否带上 `-i ~/.ssh/layout-course.pem`
- 私钥权限：`chmod 600 ~/.ssh/layout-course.pem`
- 密钥是否已绑定到实例：控制台 →「SSH 密钥」查看
- 想看握手细节：`ssh -vvv -i ~/.ssh/layout-course.pem ubuntu@43.133.237.170`

**2. `WARNING: UNPROTECTED PRIVATE KEY FILE!`**

```bash
chmod 600 ~/.ssh/layout-course.pem
```

**3. `sudo: unable to resolve host ...`**

Ubuntu 24.04 偶发，无害。想消除就往 `/etc/hosts` 加一行主机名。

**4. Docker 命令 `permission denied`**

没升权。`sudo -i`，或命令前加 `sudo`。
想免 sudo：`usermod -aG docker ubuntu` 然后**重新登录**。

**5. `curl http://43.133.237.170/` 连不上，但服务器上 `curl localhost:8080` 正常**

99% 是云端防火墙没放行（第 5 步）。
另外确认容器映射：`docker compose ps` 应看到 `0.0.0.0:80->80/tcp`
（若还是 `127.0.0.1:8080->80/tcp`，说明没跑 `--ip`）。

**6. 反代后 502 Bad Gateway**

```bash
curl -I http://127.0.0.1:8080/     # 宿主机能否连到容器
```
不通 → 容器没起：`docker compose ps` / `docker compose logs`；
通了还 502 → nginx 配置问题：`nginx -t`、`tail -50 /var/log/nginx/error.log`。

**7. `nginx -t` 报 `Address already in use`**

80 端口被容器占了（你跑过 `--ip`）。按 6.2 的说明改回容器只监听本机。

**8. 健康检查一直 unhealthy**

```bash
docker inspect layout-course --format '{{json .State.Health}}'
docker compose exec web wget -qO- http://127.0.0.1:80/healthz
```
`--start-period` 是 5 秒，刚启动时是 `starting`，等 30 秒再看。

**9. 磁盘满了**

```bash
docker system prune -af --volumes
df -h /
```
本镜像约 50 MB，正常不会占满 40 GB。

**10. 确认镜像里到底有什么**

```bash
docker run --rm layout-course:latest ls -R /usr/share/nginx/html
```
应正好 14 个文件，**没有 `tools/`、没有 `v2.zip`**。

---

## 一页速查

```bash
# ---- Mac 本机 ----
ssh -i ~/.ssh/layout-course.pem ubuntu@43.133.237.170     # 登录（用户名 ubuntu）
scp -i ~/.ssh/layout-course.pem /tmp/layout-course.tar.gz ubuntu@43.133.237.170:/home/ubuntu/
ssh -i ~/.ssh/layout-course.pem -L 8080:127.0.0.1:8080 ubuntu@43.133.237.170   # 安全预览
curl -I http://43.133.237.170/healthz                     # 验证对外可达
node tools/probe.mjs https://你的域名/index.html           # 线上回归测试

# ---- 服务器上（ssh 之后，先 sudo -i）----
sudo -i                                    # 升权到 root
cd /opt/layout-course
bash deploy.sh --check                      # 部署前体检
bash deploy.sh                              # 一键部署（仅本机可访问）
bash deploy.sh --ip                         # 改成 80 直接对外
bash deploy.sh --update                     # 更新内容后重建
docker compose logs -f                      # 看日志
docker compose ps                           # 看状态
docker stats layout-course --no-stream      # 看资源
```

### 记住这三条就不会卡住

1. **用户名是 `ubuntu`**，用 `-i` 指定私钥 —— **不是 root + 密码**
2. **要 root 权限先 `sudo -i`**
3. **云端防火墙不放行 80，外面永远连不上**
