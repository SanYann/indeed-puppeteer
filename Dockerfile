#syntax=docker/dockerfile:1.3

FROM public.ecr.aws/lambda/nodejs:20 AS base
WORKDIR /var/task
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json

FROM base AS dependencies
RUN npm install --silent --production

FROM dependencies AS build_depedencies
RUN npm install --silent
COPY . .
RUN npm run build

FROM base AS production
COPY --from=dependencies /var/task/node_modules ./node_modules
COPY --from=build_depedencies /var/task/dist dist
COPY src/indeed/inject.js /var/task/dist
RUN cp -R /var/task/dist/* . && rm -rf /var/task/dist

CMD ["indeed.handler"]
