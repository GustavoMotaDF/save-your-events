print_info() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

check_directory() {
    local DIRECTORY=$1
    if [ ! -d "$DIRECTORY" ]; then
        mkdir -p "$DIRECTORY"
        echo "Diretório $DIRECTORY criado."
    else
        echo "Diretório $DIRECTORY já existe."
    fi
}

set_permissions() {
    local DIRECTORY=$1
    sudo chown -R debian-tor:debian-tor "$DIRECTORY"
    sudo chmod -R 700 "$DIRECTORY"
    echo "Permissões configuradas para $DIRECTORY."
}

TOR_DIR="/volume/save-your-events/tor/"

print_info "Verificando diretórios..."
check_directory "$TOR_DIR"

print_info "Aplicando permissões aos diretórios TOR..."
set_permissions "$TOR_DIR"


DOCKER_COMPOSE="docker compose"
if ! command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
fi

print_info "dropping containers..."
$DOCKER_COMPOSE down

IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "save-your-events")
if [ -n "$IMAGES" ]; then
    for IMAGE in $IMAGES; do
        print_info "removing images: $IMAGE"
        docker rmi -f "$IMAGE"
    done
else
    print_info "No images with 'save-your-events' found."
fi

print_info "Uploading containers with new images..."
$DOCKER_COMPOSE up --build -d
if [ $? -eq 0 ]; then
    print_success "Containers started successfully."
else
    print_error "Error starting containers."
    exit 1
fi