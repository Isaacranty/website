FROM golang:1.22-alpine AS build
WORKDIR /app
COPY . .
RUN go build -o service .

FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/service .
EXPOSE 8081
CMD ["./service"]
