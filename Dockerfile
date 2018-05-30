FROM node:8-alpine AS build
WORKDIR /app

ARG API_ROOT
ARG SENTRY_DSN
ARG COMMIT_SHA

COPY package.json .
COPY yarn.lock .
RUN yarn

ADD . .
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_API_ROOT=${API_ROOT}
ENV REACT_APP_SENTRY_DSN=${SENTRY_DSN}
ENV REACT_APP_COMMIT_SHA=${COMMIT_SHA}
ENV REACT_APP_SANDRA_STAGE=true
RUN yarn build

FROM nginx:1.13.10-alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/build .
