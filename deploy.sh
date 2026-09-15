#!/usr/bin/env bash
# ============================================================
# deploy.sh — 在服务器上一条命令完成部署
#
#   bash deploy.sh              # 构建并启动
#   bash deploy.sh --update     # 更新代码后重建
#   bash deploy.sh --check      # 只做环境检查，不做任何改动
#   bash deploy.sh --ip         # 把默认端口改成 80 直接对外（不用宿主机 nginx）
#
# 幂等：可以反复运行，不会重复安装或破坏已有容器。
# 目标系统：Ubuntu / Debian（腾讯云轻量默认镜像）
# ============================================================
set -euo pipefail

# ---------- 输出 ----------
if [ -t 1 ]; then
  B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; C=$'\033[36m'; N=$'\033[0m'
else
  B=""; G=""; Y=""; R=""; C=""; N=""
fi
step() { printf '\n%s==> %s%s\n' "$B$C" "$1" "$N"; }
ok()   { printf '  %s✓%s %s\n' "$G" "$N" "$1"; }
warn() { printf '  %s!%s %s\n' "$Y" "$N" "$1"; }
die()  { printf '  %s✗%s %s\n' "$R" "$N" "$1" >&2; exit 1; }

MODE="deploy"
for a in "$@"; do
  case "$a" in
    --update) MODE="update" ;;
    --check)  MODE="check" ;;
    --ip)     MODE="ip" ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) die "未知参数：$a（用 --help 看用法）" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------- 1. 环境检查 ----------
step "1/6 检查环境"

if [ "$(uname -s)" != "Linux" ]; then
  warn "当前系统是 $(uname -s)，本脚本需要在服务器（Linux）上运行"
  if [ "$MODE" != "check" ]; then
    cat <<'EOS'

  这个脚本要在你的云服务器里执行，不是在本地 Mac 上。

  正确顺序（Ubuntu 镜像用 ubuntu 用户 + 私钥，不是 root + 密码）：
    ① ssh -i ~/.ssh/layout-course.pem ubuntu@<你的公网IP>
    ② 登录后执行 sudo -i 取得 root 权限
    ③ 进项目目录执行 bash deploy.sh

  逐步实操见 README.md

EOS
    exit 1
  fi
fi

if [ -f /etc/os-release ]; then
  . /etc/os-release
  ok "系统：${PRETTY_NAME:-$ID}"
fi

ARCH="$(uname -m)"
ok "架构：$ARCH"
if [ "$(uname -s)" = "Linux" ]; then
  case "$ARCH" in
    x86_64)  ok "架构 x86_64：可用官方 nginx 镜像" ;;
    aarch64) ok "架构 aarch64：可用官方 nginx 镜像（多架构）" ;;
    *) warn "架构 $ARCH 可能没有对应的 nginx 镜像" ;;
  esac
fi

MEM_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo 0)
if [ "${MEM_MB:-0}" -gt 0 ]; then
  [ "$MEM_MB" -ge 400 ] && ok "内存：${MEM_MB} MB" || warn "内存仅 ${MEM_MB} MB，偏紧"
fi
DISK_MB=$(df -m . | awk 'NR==2{print $4}')
[ "${DISK_MB:-0}" -ge 1024 ] && ok "可用磁盘：${DISK_MB} MB" || warn "磁盘仅 ${DISK_MB} MB"

# ---------- 2. Docker ----------
step "2/6 检查 Docker"

if command -v docker >/dev/null 2>&1; then
  ok "docker 已安装：$(docker --version)"
else
  warn "未检测到 docker"
  if [ "$MODE" = "check" ]; then
    warn "（--check 模式，不安装）"
  else
    printf '  是否现在安装 Docker？[y/N] '
    read -r ans </dev/tty || ans=n
    if [ "${ans:-n}" = "y" ] || [ "${ans:-n}" = "Y" ]; then
      curl -fsSL https://get.docker.com | sh
      sudo usermod -aG docker "$USER" || true
      ok "Docker 已安装（组权限需重新登录生效，本次仍用 sudo）"
    else
      die "请先安装 Docker：curl -fsSL https://get.docker.com | sh"
    fi
  fi
fi

# 需要 sudo 吗？
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1 || sudo docker info >/dev/null 2>&1; then
    DOCKER="sudo docker"
    warn "当前用户不在 docker 组，本次用 sudo docker"
    warn "建议执行：sudo usermod -aG docker \$USER  然后重新登录"
  elif [ "$MODE" = "check" ]; then
    warn "无法连接 Docker daemon（--check 模式，不中断）"
  else
    die "无法连接 Docker daemon，请先启动：sudo systemctl start docker"
  fi
fi

if $DOCKER compose version >/dev/null 2>&1; then
  ok "docker compose：$($DOCKER compose version --short 2>/dev/null || echo 可用)"
else
  warn "未找到 docker compose 插件，尝试安装"
  if [ "$MODE" = "check" ]; then
    warn "（--check 模式，不安装）"
  else
    sudo apt-get update -qq && sudo apt-get install -y docker-compose-plugin
    ok "docker compose 已安装"
  fi
fi

# ---------- 3. 站点文件 ----------
step "3/6 检查站点文件"

REQUIRED="index.html styles.css i18n.js site.js demos.js lesson-content.js extra-content.js
          Dockerfile docker-compose.yml docker/nginx.conf.template
          lesson-01/index.html lesson-02/index.html lesson-03/index.html lesson-04/index.html
          lesson-05/index.html lesson-06/index.html lesson-07/index.html"

MISSING=""
for f in $REQUIRED; do
  [ -s "$f" ] || MISSING="$MISSING $f"
done
if [ -n "$MISSING" ]; then
  printf '%s\n' "$MISSING" | tr ' ' '\n' | sed '/^$/d' | sed 's/^/    - /'
  die "缺少上述文件。请确认已把 Dockerfile、docker/ 目录一起上传"
fi
ok "全部 17 个必要文件就位"

# 权限检查：容器里的 nginx worker 以 nginx 用户（UID 101）运行，
# 不是 root。文件若不可被其他用户读取（如 600），访问会 403 Forbidden。
# git 只记录 100644/100755，所以 clone 后通常没问题；
# 但若用 rsync/scp 传输或 umask 异常就会出现，这里提前拦住。
# 检查「其他用户」读位（看 mode 最后一位）
NOREAD=""
for f in $REQUIRED; do
  m=$(stat -c '%a' "$f" 2>/dev/null || stat -f '%OLp' "$f" 2>/dev/null || echo "")
  [ -n "$m" ] || continue
  last=$(printf '%s' "$m" | tail -c 2)
  case "$last" in
    *4|*5|*6|*7) ;;
    *) NOREAD="$NOREAD $f" ;;
  esac
done

if [ -n "$NOREAD" ]; then
  warn "以下文件的『其他用户』无读权限，容器内 nginx worker 会读不到 → 403："
  printf '%s\n' "$NOREAD" | tr ' ' '\n' | sed '/^$/d' | sed 's/^/      /'
  if [ "$MODE" = "check" ]; then
    printf '      执行修复： chmod -R a+rX .\n'
  else
    chmod -R a+rX . 2>/dev/null && ok "已自动修正（chmod -R a+rX .）"
  fi
else
  ok "文件权限正常（其他用户可读，容器内 nginx worker 能读到）"
fi

if [ -z "${MISSING}" ] && [ "$MODE" != "check" ] && [ -d .git ]; then
  ok "检测到 git 仓库，可用 git pull 更新代码"
fi

# ---------- 4. 端口选择 ----------
step "4/6 选择对外端口"

COMPOSE_FILE="docker-compose.yml"
if [ "$MODE" = "ip" ]; then
  # 把 127.0.0.1:8080:80 改成 80:80，直接对外
  if grep -q '"127.0.0.1:8080:80"' "$COMPOSE_FILE"; then
    sed -i.bak 's|"127.0.0.1:8080:80"|"80:80"|' "$COMPOSE_FILE"
    ok "已改为直接对外：宿主 80 → 容器 80"
    warn "记得在腾讯云控制台「防火墙」放行 TCP 80"
  else
    ok "端口配置已是自定义状态，未改动"
  fi
else
  cur=$(grep -oE '"[0-9.]+:[0-9]+:80"' "$COMPOSE_FILE" | head -1 || true)
  ok "当前映射：${cur:-未识别}"
  printf '  这表示容器只监听本机，外部需经宿主机 nginx/Caddy 反代（推荐）\n'
  printf '  若想直接对外，重跑：bash deploy.sh --ip\n'
fi

[ "$MODE" = "check" ] && { step "检查完毕（--check 模式，未做改动）"; exit 0; }

# ---------- 5. 构建并启动 ----------
step "5/6 构建镜像并启动容器"

if [ "$MODE" = "update" ]; then
  ok "更新模式：重建镜像"
fi

$DOCKER compose up -d --build

printf '  等待健康检查'
for i in $(seq 1 30); do
  st=$($DOCKER inspect --format '{{.State.Health.Status}}' layout-course 2>/dev/null || echo starting)
  case "$st" in
    healthy) printf '\r'; ok "容器状态：healthy"; break ;;
    unhealthy) printf '\r'; warn "容器状态：unhealthy（看下面的日志）"; break ;;
    *) printf '.'; sleep 2 ;;
  esac
  [ "$i" = "30" ] && { printf '\r'; warn "等待超时，当前状态：$st"; }
done

echo
$DOCKER compose ps

# ---------- 6. 自测 ----------
step "6/6 本机自测"

HOSTPORT=$(grep -oE '"[0-9.]+:([0-9]+):80"' "$COMPOSE_FILE" | head -1 | awk -F: '{print $(NF-1)}')
HOSTPORT=${HOSTPORT:-8080}

test_url() {
  local path="$1" expect="$2" label="$3"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${HOSTPORT}${path}" || echo 000)
  if [ "$code" = "$expect" ]; then ok "$label → $code"
  else warn "$label → $code（期望 $expect）"; fi
}

if command -v curl >/dev/null 2>&1; then
  test_url /            200 "首页"
  test_url /healthz     200 "健康检查"
  test_url /lesson-03/index.html 200 "第 3 章"
  test_url /nope.html   404 "不存在的页面"

  gz=$(curl -s -H 'Accept-Encoding: gzip' -o /dev/null -w '%{size_download}' \
        "http://127.0.0.1:${HOSTPORT}/demos.js" 2>/dev/null || echo 0)
  if [ "$gz" -gt 0 ] && [ "$gz" -lt 80000 ]; then
    ok "gzip 生效：demos.js ${gz} 字节（未压缩 153722）"
  else
    warn "gzip 似乎未生效：demos.js ${gz} 字节"
  fi
else
  warn "没有 curl，跳过自测"
fi

# ---------- 收尾提示 ----------
step "完成"
PUBIP=$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || echo "你的公网IP")
cat <<EOF

  容器已运行。接下来：

  ① 云端放行端口
     腾讯云控制台 → 轻量应用服务器 → 防火墙 → 添加规则
       应用类型：HTTP(80)   来源：全部 IPv4
       （若想上 HTTPS，再加一条 HTTPS(443)）

  ② 直接验证（用公网 IP）
     curl -I http://${PUBIP}/healthz
     浏览器打开 http://${PUBIP}/

  ③ 想绑域名 + HTTPS
     域名解析添加 A 记录 → ${PUBIP}，然后按 README.md 第六节配置反代与证书。

  常用命令
     docker compose logs -f --tail=100     # 看日志
     docker compose restart                # 重启
     docker stats layout-course --no-stream # 资源占用
     bash deploy.sh --update               # 更新代码后重建

  完整实操手册见 README.md

EOF
