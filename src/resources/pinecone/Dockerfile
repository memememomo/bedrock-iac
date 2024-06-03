FROM --platform=$TARGETPLATFORM golang:1 as build
WORKDIR /usr/src/app
ARG TARGETOS
ARG TARGETARCH
COPY go.mod go.sum ./
RUN go mod download && go mod tidy
COPY . .
RUN env CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -v -o /main

FROM --platform=$TARGETPLATFORM public.ecr.aws/lambda/provided:al2023
COPY --from=build /main ${LAMBDA_RUNTIME_DIR}/bootstrap
CMD [ "main" ]