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

# 构建期自检：缺文件就立刻失败，而不是部署后才发现 404
RUN set -eu; \
    for f in index.html styles.css i18n.js site.js demos.js \
             lesson-content.js extra-content.js \
             lesson-01/index.html lesson-02/index.html lesson-03/index.html \
             lesson-04/index.html lesson-05/index.html lesson-06/index.html \
             lesson-07/index.html; do \
      [ -s "$f" ] || { echo "缺少文件: $f" >&2; exit 1; }; \
    done; \
    echo "静态文件校验通过，共 $(find . -type f | wc -l) 个文件，$(du -sh . | cut -f1)"

# ---------- 阶段 2：运行 ----------
FROM nginx:1.27-alpine

# 站点配置模板：容器启动时由官方 entrypoint 用 envsubst 渲染，
# 因此 ${NGINX_PORT} 这类变量可以在 docker run 时覆盖
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# 静态文件
COPY --from=build /src /usr/share/nginx/html

# 默认端口（可在运行时用 -e NGINX_PORT=8080 覆盖）
ENV NGINX_PORT=80

# 与 nginx.conf.template 里的 /healthz 对应
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${NGINX_PORT}/healthz" >/dev/null 2>&1 || exit 1

EXPOSE 80

# 前台运行，让容器生命周期跟随 nginx
CMD ["nginx", "-g", "daemon off;"]
