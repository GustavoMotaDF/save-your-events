FROM nginx

WORKDIR /app

RUN apt-get update && apt-get install -y tor curl openssl && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/lib/tor/hidden_service && \
    chown -R debian-tor:debian-tor /var/lib/tor && \
    chmod 700 /var/lib/tor/hidden_service

RUN echo "HiddenServiceDir /var/lib/tor/hidden_service/" >> /etc/tor/torrc && \
    echo "HiddenServicePort 80 127.0.0.1:80" >> /etc/tor/torrc

COPY ./save-your-events/ /usr/share/nginx/html

EXPOSE 80

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]