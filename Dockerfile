# ============================================================
# 页面布局课程 · 静态站镜像
# 多阶段构建：只把运行所需的 14 个文件放进最终镜像
# 最终镜像 ≈ 50 MB（几乎全是 nginx:alpine 本身）
# ============================================================

# ---------- 阶段 1：准备 / 校验静态文件 ----------
FROM alpine:3.20 AS build

WORKDIR /src

# 只拷贝运行必需的资源，tools/ 与截图不进镜像
COPY index.html            ./
COPY styles.css            ./
COPY i18n.js               ./
COPY site.js               ./
COPY demos.js              ./
COPY lesson-content.js     ./
COPY extra-content.js      ./
COPY lesson-01/index.html  ./lesson-01/
COPY lesson-02/index.html  ./lesson-02/
COPY lesson-03/index.html  ./lesson-03/
COPY lesson-04/index.html  ./lesson-04/
COPY lesson-05/index.html  ./lesson-05/
COPY lesson-06/index.html  ./lesson-06/
COPY lesson-07/index.html  ./lesson-07/

# 构建期自检 + 权限规范化
#
# ① 缺文件立刻失败，而不是部署后才发现 404
# ② 权限规范化：容器内 nginx 的 worker 以 nginx 用户（UID 101）运行，
#    不是 root。如果文件是 600（只有属主可读），worker 读不到，
#    访问任何页面都会 403 Forbidden。
#    Docker 的 COPY 会保留源文件的权限位，所以这里强制放开读权限，
#    保证不管宿主机的 umask 是什么，镜像里的权限都是对的。
RUN set -eu; \
    for f in index.html styles.css i18n.js site.js demos.js \
             lesson-content.js extra-content.js \
             lesson-01/index.html lesson-02/index.html lesson-03/index.html \
             lesson-04/index.html lesson-05/index.html lesson-06/index.html \
             lesson-07/index.html; do \
      [ -s "$f" ] || { echo "缺少文件: $f" >&2; exit 1; }; \
    done; \
    chmod -R a+rX .; \
    echo "静态文件校验通过，共 $(find . -type f | wc -l) 个文件，$(du -sh . | cut -f1)"; \
    echo "权限已规范化："; \
    ls -l index.html | awk '{print "  " $1 "  " $NF}'

# ---------- 阶段 2：运行 ----------
FROM nginx:1.27-alpine

# 站点配置模板：容器启动时由官方 entrypoint 用 envsubst 渲染，
# 因此 ${NGINX_PORT} 这类变量可以在 docker run 时覆盖
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# 静态文件
COPY --from=build /src /usr/share/nginx/html

# 兜底再规范化一次权限。
# 放在这里而不是只放在 build 阶段，是因为 COPY --from 由本阶段执行，
# 在某些构建器实现下权限位的传递行为不完全一致；这一步成本几乎为零，
# 却能从根上杜绝「镜像里文件是 600 → nginx worker 读不到 → 403」。
RUN chmod -R a+rX /usr/share/nginx/html /etc/nginx/templates \
 && echo "镜像内文件权限已确认为 world-readable"

# 默认端口（可在运行时用 -e NGINX_PORT=8080 覆盖）
ENV NGINX_PORT=80

# 与 nginx.conf.template 里的 /healthz 对应
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${NGINX_PORT}/healthz" >/dev/null 2>&1 || exit 1

EXPOSE 80

# 前台运行，让容器生命周期跟随 nginx
CMD ["nginx", "-g", "daemon off;"]
