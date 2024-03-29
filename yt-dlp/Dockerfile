# Utilizes Jeeaaasus/youtube-dl's Dockerfile ideas

FROM nikolaik/python-nodejs:python3.12-nodejs21-slim

ENV S6_BEHAVIOUR_IF_STAGE2_FAILS="2" \
    PUID="911" \
    PGID="911" \
    UMASK="022"

RUN set -x && \
    addgroup --gid "$PGID" abc && \
    adduser \
        --gecos "" \
        --disabled-password \
        --no-create-home \
        --uid "$PUID" \
        --ingroup abc \
        --shell /bin/bash \
        abc 

COPY ./app /app
COPY ./etc/cont-init.d /etc/cont-init.d
COPY ./etc/services.d /etc/services.d

RUN set -x && \
    apt update && \
    apt install -y \
        file \
        wget && \
    apt clean

RUN set -x && \
    ARCH=`uname -m` && \
    if [ "$ARCH" = "x86_64" ]; then \
        wget -q 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz' -O - | tar -xJ -C /tmp/ --one-top-level=ffmpeg && \
        chmod -R a+x /tmp/ffmpeg/* && \
        mv $(find /tmp/ffmpeg/* -name ffmpeg) /usr/local/bin/ && \
        mv $(find /tmp/ffmpeg/* -name ffprobe) /usr/local/bin/ && \
        mv $(find /tmp/ffmpeg/* -name ffplay) /usr/local/bin/ && \
        rm -rf /tmp/* ; \
    else \
        if [ "$ARCH" = "aarch64" ]; then ARCH='arm64'; fi && \
        wget -q "https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-${ARCH}-static.tar.xz" -O - | tar -xJ -C /tmp/ --one-top-level=ffmpeg && \
        chmod -R a+x /tmp/ffmpeg/* && \
        mv $(find /tmp/ffmpeg/* -name ffmpeg) /usr/local/bin/ && \
        mv $(find /tmp/ffmpeg/* -name ffprobe) /usr/local/bin/ && \
        rm -rf /tmp/* ; \
    fi

RUN set -x && \
    python3 -m pip --no-cache-dir install yt-dlp

WORKDIR /app

RUN set -x && \
    npm install

RUN set -ex && \
    ARCH=`uname -m` && \
    if [ "$ARCH" = "x86_64" ]; then \
        s6_package="s6-overlay-amd64.tar.gz" ; \
    elif [ "$ARCH" = "aarch64" ]; then \
        s6_package="s6-overlay-aarch64.tar.gz" ; \
    else \
        echo "unknown arch: ${ARCH}" && \
        exit 1 ; \
    fi && \
    wget -P /tmp/ https://github.com/just-containers/s6-overlay/releases/download/v2.2.0.3/${s6_package} && \
    tar -xzf /tmp/${s6_package} -C / && \
    rm -rf /tmp/*

VOLUME /config/channels.txt /appdata /data

ENTRYPOINT ["npm", "start"]