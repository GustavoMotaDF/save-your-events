
install_docker() {
    print_info "VVerifying Docker installation..."
    if ! command -v docker compose &> /dev/null; then
        print_info "Installing Docker..."
        sudo apt-get install ca-certificates curl
        sudo install -m 0755 -d /etc/apt/keyrings
        sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
        sudo chmod a+r /etc/apt/keyrings/docker.asc
        echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        if [ $? -eq 0 ]; then
            print_success "Docker installed successfully."
        else
            print_error "Failed to install Docker."
            exit 1
        fi
    else
        print_success "Docker is already installed."
    fi
}

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
        echo "Directory $DIRECTORY created."
    else
        echo "Directory $DIRECTORY already exists."
    fi
}

set_permissions() {
    local DIRECTORY=$1
    sudo chown -R debian-tor:debian-tor "$DIRECTORY"
   # sudo chmod -R 700 "$DIRECTORY"
    echo "Permissions set for $DIRECTORY."
}

TOR_DIR="/volume/save-your-events/tor/"

print_info "Scanning directories..."
check_directory "$TOR_DIR"

print_info "Applying permissions to TOR directories..."
set_permissions "$TOR_DIR"

#Call function to install Docker
install_docker

#Defines docker command verbosity
DOCKER_COMPOSE="docker compose"


print_info "Dropping containers..."
$DOCKER_COMPOSE down

IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "save-your-events")
if [ -n "$IMAGES" ]; then
    for IMAGE in $IMAGES; do
        print_info "Removing image: $IMAGE"
        docker rmi -f "$IMAGE"
    done
else
    print_info "Image: 'save-your-events' not found."
fi

print_info "Loading containers with new images..."
$DOCKER_COMPOSE up --build -d
if [ $? -eq 0 ]; then
    print_success "Containers started successfully!"
else
    print_error "Error starting containers."
    exit 1
fi