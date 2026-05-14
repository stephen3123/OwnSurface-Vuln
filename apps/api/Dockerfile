FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN cargo build --release

FROM debian:trixie-slim

RUN apt-get update && \
    apt-get install -y ca-certificates adduser curl && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system api && adduser --system --ingroup api --home /home/api api

WORKDIR /app

COPY --from=builder /app/target/release/xrayai-api /app/xrayai-api
RUN chown -R api:api /app

USER api

ENV RUST_LOG=info
EXPOSE 8080

CMD ["/app/xrayai-api"]
