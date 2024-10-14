#syntax=docker/dockerfile:1.3

FROM public.ecr.aws/lambda/nodejs:20 AS base
WORKDIR /var/task
RUN npm install -g yarn
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY tsconfig.json ./tsconfig.json
RUN dnf update -y && \
    dnf install -y \
        ca-certificates \
        liberation-fonts \
        alsa-lib \
        atk \
        cairo \
        cups-libs \
        dbus-glib \
        expat \
        fontconfig \
        libgbm \
        gcc \
        glib2 \
        gtk3 \
        nspr \
        nss \
        pango \
        # SDL \
        libX11 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXfixes \
        libXi \
        libXrandr \
        libXrender \
        libXScrnSaver \
        libXtst \
        # lsb-release \
        wget \
        xdg-utils


FROM base AS dependencies
RUN yarn install  --production --frozen-lockfile

FROM dependencies AS build_depedencies
RUN yarn install  --frozen-lockfile
COPY . .
RUN yarn run build

FROM base AS production
COPY --from=dependencies /var/task/node_modules ./node_modules
COPY --from=build_depedencies /var/task/.build .build
RUN cp -R /var/task/.build/* . && rm -rf /var/task/.build


CMD ["indeed.postHandler"]