#!/bin/bash

chown -R 102:102 /var/lib/tor/

echo "Starting Tor..."
service tor start > /dev/null 2>&1 &
TOR_PID=$!

echo "Waiting for Tor to start..."
while [ ! -f /var/lib/tor/hidden_service/hostname ]; do
    sleep 1
done

echo "Generated .onion address:"
cat /var/lib/tor/hidden_service/hostname | tee /app/onion_address.txt

echo "Starting Nginx..."
nginx -g "daemon off;"
 