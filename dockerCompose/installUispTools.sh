#!/bin/bash
# installUispTools.sh

VERSION=1.0.0  #2021-09-05:1111
echo installUispTools version $VERSION

set -o nounset
set -o errexit
set -o pipefail


SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PATH="${PATH}:/usr/local/bin"
TMP_INSTALL_DIR="${SCRIPT_DIR}"

# prerequisites "command|package"
PREREQUISITES=(
  "curl|curl"
  "sed|sed"
  "envsubst|gettext-base"
)

COMPOSE_PROJECT_NAME="uisptools"
USERNAME="${UNMS_USER:-unms}"
if getent passwd "${USERNAME}" >/dev/null; then
  HOME_DIR="$(getent passwd "${USERNAME}" | cut -d: -f6)"
else
  HOME_DIR="${UNMS_HOME_DIR:-"/home/${USERNAME}"}"
fi

# UISPTOOLS variables
export UISPTOOLS_REPO="https://https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main"
export UISPTOOLS_DOCKER_IMAGE="ghcr.io/andrewiski/uisp-tools/uisptools"
export UISPTOOLS_VERSION="0.0.3"
export UISPTOOLS_APP_DIR="${HOME_DIR}/app/uisptools"
export UISPTOOLS_DATA_DIR="${HOME_DIR}/data/uisptools"
#export NODE_ENV="production"


if [ "${SCRIPT_DIR}" = "${UISPTOOLS_APP_DIR}" ]; then
  echo >&2 "Please don't run the installation script in the application directory ${UISPTOOLS_APP_DIR}"
  exit 1
fi

#sudo mkdir -p /usr/src/uisptools
#sudo chown "$USER":"docker" /usr/src/uisptools
#mkdir -p /usr/src/uisptools/config
#sudo chown "$USER":"docker" /usr/src/uisptools/config
#mkdir -p /usr/src/uisptools/data/mongodb
#sudo chown "$USER":"docker" /usr/src/uisptools/data
#sudo chown "$USER":"docker" /usr/src/uisptools/data/mongodb


pull_install_files(){
	curl -sL "${UISPTOOLS_REPO}/docker-compose.yml" -o ${UISPTOOLS_APP_DIR}/docker-compose.yml || fail "Download of docker-compose.yml failed."
	curl -sL "${UISPTOOLS_REPO}/mongodb/createDatabase.js" -o ${UISPTOOLS_APP_DIR}/createDatabase.js || fail "Download of createDatabase.js failed."

}

create_app_folder() {
  

  mkdir -p -m 700 "${UISPTOOLS_APP_DIR}"
  chown -R "${USERNAME}" "${UISPTOOLS_APP_DIR}" || true
}

create_data_volumes() {
  

  volumes=(
    "${UISPTOOLS_DATA_DIR}"
    "${UISPTOOLS_DATA_DIR}/mongodb"
  )

  for volume in "${volumes[@]}"; do
    mkdir -p -m u+rwX,g-rwx,o-rwx "${volume}" || fail "Failed to create volume '${volume}'."
    if [ "${EUID}" -eq 0 ]; then
      chown "${USERNAME}" "${volume}" || fail "Failed to change ownership of '${volume}'."
    fi
  done
}

create_user() {
  if [ -z "$(getent passwd ${USERNAME})" ]; then
    echo "Creating user ${USERNAME}, home dir '${HOME_DIR}'."
    if [ -z "$(getent group ${USERNAME})" ]; then
      useradd -m -d "${HOME_DIR}" -G docker "${USERNAME}" || fail "Failed to create user '${USERNAME}'"
    else
      useradd -m -d "${HOME_DIR}" -g "${USERNAME}" -G docker "${USERNAME}" || fail "Failed to create user '${USERNAME}'"
    fi
  elif ! getent group docker | grep -q "\b${USERNAME}\b" \
      || ! [ -d "${HOME_DIR}" ] \
      || [ "$(stat --format '%u' "${HOME_DIR}")" != "$(id -u "${USERNAME}")" ]; then
    echo >&2 "WARNING: User '${USERNAME}' already exists. We are going to ensure that the"
    echo >&2 "user is in the 'docker' group and that its home '${HOME_DIR}' dir exists and"
    echo >&2 "is owned by the user."
    if ! [ "$UNATTENDED" = true ]; then
      confirm "Would you like to continue with the installation?" || exit 1
    fi
  fi

  if ! getent group docker | grep -q "\b${USERNAME}\b"; then
    echo "Adding user '${USERNAME}' to docker group."
    if ! usermod -aG docker "${USERNAME}"; then
      echo >&2 "Failed to add user '${USERNAME}' to docker group."
      exit 1
    fi
  fi

  if ! [ -d "${HOME_DIR}" ]; then
    echo "Creating home directory '${HOME_DIR}'."
    if ! mkdir -p "${HOME_DIR}"; then
      echo >&2 "Failed to create home directory '${HOME_DIR}'."
      exit 1
    fi
  fi

  if [ "$(stat --format '%u' "${HOME_DIR}")" != "$(id -u "${USERNAME}")" ]; then
    chown "${USERNAME}" "${HOME_DIR}"
  fi

  export USER_ID=$(id -u "${USERNAME}")
}


remove_old_image() {
  local containerName="$1"
  local imageName="$2"
  local currentImage="$(docker ps --format "{{.Image}}" --filter name="^${containerName}$" || true)"
  if [ -z "${currentImage}" ]; then
    return 0;
  fi

  local allImages="$(docker images "${imageName}:"* --format "{{.Repository}}:{{.Tag}}" || true)"
  if [ -z "${allImages}" ]; then
    return 0;
  fi

  for value in ${allImages}; do
    if [ "${value}" != "${currentImage}" ]; then
      echo "Removing old image '${value}'"
      if ! docker rmi "${value}"; then
        echo "Failed to remove old image '${value}'"
      fi
   fi
  done
}

remove_old_images() {
  echo "Removing old images"
  danglingImages="$(docker images -qf "dangling=true")"
  if [ ! -z "${danglingImages}" ]; then
    echo "Removing dangling images"
    docker rmi ${danglingImages} || true;
  fi

  remove_old_image "uisptools" "${DOCKER_IMAGE}"

}

change_owner() {
  # only necessary when installing for the first time, as root
  if [ "${EUID}" -eq 0 ]; then
    cd "${HOME_DIR}"

    if ! chown -R "${USERNAME}" ./*; then
      echo >&2 "Failed to change config files owner"
      exit 1
    fi
  fi
    
}

start_docker_containers() {
  echo "Starting uisptools docker containers."
  docker-compose -p uisptools -f "${DOCKER_COMPOSE_PATH}" up -d uisptools || fail "Failed to start docker containers"
}


confirm_success() {
  echo "Waiting for UISPTools to start"
  n=0
  until [ ${n} -ge 10 ]
  do
    sleep 3s
    uispToolsRunning=true
    # env -i is to ensure that http[s]_proxy variables are not set
    # Otherwise the check would go through proxy.
    env -i curl -skL "https://127.0.0.1:${HTTPS_PORT}" > /dev/null && break
    echo "."
    uispToolsRunning=false
    n=$((n+1))
  done

  docker ps

  if [ "${uispToolsRunning}" = true ]; then
    echo "UISPTools is running"
  else
    fail "UISPTools is NOT running"
  fi
}


# prepare --silent option for curl
curlSilent=""
if [ "${UNATTENDED}" = "true" ]; then
  curlSilent="--silent"
fi

create_user
create_app_folder
pull_install_files
create_data_volumes
change_owner
start_docker_containers
remove_old_images
confirm_success
exit 0