FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /backend .

FROM gcr.io/distroless/static-debian12
COPY --from=builder /backend /backend
ENV PORT=8080
EXPOSE 8080
CMD ["/backend"]
