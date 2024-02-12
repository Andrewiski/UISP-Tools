#!/bin/bash
# installUispToolsStandAlone.sh

VERSION=0.0.2.2024-02-12:0001
echo installUispToolsStandAlone version $VERSION

UISPTOOLS_USER=""
UISPTOOLS_HOME_DIR=""

GOOGLEAPIKEY=""
NOCREATEUSER=""
MONGODBSERVERURL=""       
MONGODBUSERNAME="" 
MONGODBPASSWORD="" 
MONGODBDATABASE="" 
UNATTENDED="false"

cliexit() {
    printf '%s\n' "$1" >&2
    exit 1
}

usage() { 
  echo "$0 usage:" && grep " .)\ #" $0; exit 0; 
}

while :; do
    case $1 in
        -username) # username to install under. 
          if [ "$2" ]; then
            UISPTOOLS_USER=$2
            shift
          else
            cliexit 'ERROR: "--username" requires a non-empty option argument.'
          fi
          ;;
        -googleapikey) # google api key. 
          if [ "$2" ]; then
              GOOGLEAPIKEY=$2
            shift
          else
            cliexit 'ERROR: "--googleapikey" requires a non-empty option argument.'
          fi
          ;;
        -alias) # Docker Process Allias. 
          if [ "$2" ]; then
              UISPTOOLS_ALIAS=-$2
            shift
          else
            cliexit 'ERROR: "--alias" requires a non-empty option argument.'
          fi
          ;;
          
        -installdir) # install Directory. 
          if [ "$2" ]; then
              UISPTOOLS_HOME_DIR=$2
            shift
          else
            cliexit 'ERROR: "--installdir" requires a non-empty option argument.'
          fi
          ;;
        -mongodbserverurl) # mongodb server url.
          if [ "$2" ]; then
              MONGODBSERVERURL=$2
            shift
          else
            cliexit 'ERROR: "--mongodbserverurl" requires a non-empty option argument.'
          fi
          ;;
        -mongodbusername) # mongodb username.
          if [ "$2" ]; then
              MONGODBUSERNAME=$2
            shift
          else
            cliexit 'ERROR: "--mongodbusername" requires a non-empty option argument.'
          fi
          ;;
        -mongodbpassword) # mongodb password.
          if [ "$2" ]; then
              MONGODBPASSWORD=$2
            shift
          else
            cliexit 'ERROR: "--mongodbserverurl" requires a non-empty option argument.'
          fi
          ;;
        -mongodbdatabase) # mongodb database.
          if [ "$2" ]; then
              MONGODBDATABASE=$2
            shift
          else
            cliexit 'ERROR: "--mongodbdatabase" requires a non-empty option argument.'
          fi
          ;;
        -nocreateuser) # do not create user in host operating system. 
          NOCREATEUSER="TRUE"
        ;;
        -h|-\?|--help) # Display help.
          usage
          exit 0
          ;;
        --)              # End of all options.
            shift
            break
            ;;
        -?*)
            printf 'WARN: Unknown option (ignored): %s\n' "$1" >&2
            ;;
        *)               # Default case: No more options, so break out of the loop.
            break
    esac
  shift
done


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

HTTP_PORT="49080"
COMPOSE_PROJECT_NAME="andrewiski/uisptools:latest"
COMPOSE_CONTAINER_NAME="uisptools"
USERNAME="${UISPTOOLS_USER:-$USER}"

if [ ! -z "${UISPTOOLS_HOME_DIR}" ]; then
    echo "installdir is set to ${UISPTOOLS_HOME_DIR}"
    HOME_DIR="${UISPTOOLS_HOME_DIR}"
else
    if [ -x "$(command -v getent)" ]; then
        if getent passwd "${USERNAME}" >/dev/null; then
        HOME_DIR="$(getent passwd "${USERNAME}" | cut -d: -f6)"
        else
        HOME_DIR="${UISPTOOLS_HOME_DIR:-"/home/${USERNAME}"}"
        fi
    else  
      HOME_DIR=$(bash -c "cd ~$(printf %q "$USERNAME") && pwd")        
    fi
fi

echo "Processing..."

echo "UserName is $USERNAME"
echo "Home Directoy is $HOME_DIR"
echo "GOOGLEAPIKEY is $GOOGLEAPIKEY"
echo "UISPTOOLS_ALIAS is $UISPTOOLS_ALIAS"
echo "NOCREATEUSER is $NOCREATEUSER"

# UISPTOOLS variables

export UISPTOOLS_REPO="https://raw.githubusercontent.com/Andrewiski/uisp-tools/main"
export UISPTOOLS_APP_DIR="${HOME_DIR}/uisptools/app"
export UISPTOOLS_DATA_DIR="${HOME_DIR}/uisptools/data"
export UISPTOOLS_DOCKER_COMPOSE_PATH="${UISPTOOLS_APP_DIR}/docker-compose.yml"

if [ "${SCRIPT_DIR}" = "${UISPTOOLS_APP_DIR}" ]; then
  echo >&2 "Please don't run the installation script in the application directory ${UISPTOOLS_APP_DIR}"
  exit 1
fi

#sudo mkdir -p /usr/src/UISPTOOLS
#sudo chown "$USER":"docker" /usr/src/UISPTOOLS
#mkdir -p /usr/src/UISPTOOLS/config
#sudo chown "$USER":"docker" /usr/src/UISPTOOLS/config
#mkdir -p /usr/src/UISPTOOLS/data/mongodb
#sudo chown "$USER":"docker" /usr/src/UISPTOOLS/data
#sudo chown "$USER":"docker" /usr/src/UISPTOOLS/data/mongodb

cleanup() {
  # Cleanup temp install dir.
  if [ "${TMP_INSTALL_DIR}" != "${SCRIPT_DIR}" ] ; then
    #rm -rf "${TMP_INSTALL_DIR}" || true;
    echo "Cleanup Disabled for now"
  fi
}

fail() {
  echo -e "ERROR: $1" >&2
  cleanup || true;
  exit 1
}

pull_install_files(){ 
  echo "downloading ${UISPTOOLS_REPO}/dockerCompose/docker-compose.yml"
  curl -LS "${UISPTOOLS_REPO}/dockerCompose/docker-compose.yml" -o "${UISPTOOLS_APP_DIR}/docker-compose.yml"
  echo "downloading ${UISPTOOLS_REPO}/mongodb/docker-entrypoint-initdb.d/01_createDatabase.js"
  curl -LS "${UISPTOOLS_REPO}/mongodb/docker-entrypoint-initdb.d/01_createDatabase.js" -o "${UISPTOOLS_DATA_DIR}/mongodb/docker-entrypoint-initdb.d/01_createDatabase.js"
  echo "downloading ${UISPTOOLS_REPO}/mongodb/docker-entrypoint-initdb.d/02_initWebServerPages.js"
  curl -LS "${UISPTOOLS_REPO}/mongodb/docker-entrypoint-initdb.d/02_initWebServerPages.js" -o "${UISPTOOLS_DATA_DIR}/mongodb/docker-entrypoint-initdb.d/02_initWebServerPages.js"
 }

create_app_folder() {
  mkdir -p -m 770 "${UISPTOOLS_APP_DIR}"
  chown -R "${USERNAME}" "${UISPTOOLS_APP_DIR}" || true
}

create_data_volumes() {
  volumes=(
    "${UISPTOOLS_DATA_DIR}"
    "${UISPTOOLS_DATA_DIR}/config"
    "${UISPTOOLS_DATA_DIR}/logs"
    "${UISPTOOLS_DATA_DIR}/mongodb"
    "${UISPTOOLS_DATA_DIR}/mongodb/data"
    "${UISPTOOLS_DATA_DIR}/mongodb/data/db"
    "${UISPTOOLS_DATA_DIR}/mongodb/data/configdb"
    "${UISPTOOLS_DATA_DIR}/mongodb/docker-entrypoint-initdb.d"
  )

  for volume in "${volumes[@]}"; do
    echo "Creating volume ${volume}"
    mkdir -p -m u+rwX,g+rw,o-wx "${volume}" || fail "Failed to create volume '${volume}'."
    if [ "${EUID}" -eq 0 ]; then
      chown "${USERNAME}:docker" "${volume}" || fail "Failed to change ownership of '${volume}'."
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

  local allImages="$(docker images "${imageName}"* --format "{{.Repository}}:{{.Tag}}" || true)"
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

get_latest_image() {
    echo "performing docker pull \"${COMPOSE_PROJECT_NAME}\""
    docker pull "${COMPOSE_PROJECT_NAME}"
  
}

remove_old_images() {
  echo "Removing old images"
  danglingImages="$(docker images -qf "dangling=true")"
  if [ ! -z "${danglingImages}" ]; then
    echo "Removing dangling images"
    docker rmi ${danglingImages} || true;
  fi

  remove_old_image "${COMPOSE_PROJECT_NAME}" "${COMPOSE_CONTAINER_NAME}"

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
  echo "GOOGLEAPIKEY=$GOOGLEAPIKEY" > ${UISPTOOLS_APP_DIR}/uisptools.env
  echo "UISPTOOLS_ALIAS=$UISPTOOLS_ALIAS" >> ${UISPTOOLS_APP_DIR}/uisptools.env
  
  echo "Starting UispTools docker containers."
  docker-compose -p "uisptools" --env-file "${UISPTOOLS_APP_DIR}/uisptools.env" -f "${UISPTOOLS_DOCKER_COMPOSE_PATH}" up -d uisptools || fail "Failed to start docker containers"
}


confirm_success() {
  echo "Waiting for UISPTOOLS to start"
  n=0
  until [ ${n} -ge 10 ]
  do
    sleep 3s
    UISPTOOLSRunning=true
    # env -i is to ensure that http[s]_proxy variables are not set
    # Otherwise the check would go through proxy.
    env -i curl -skL "http://127.0.0.1:${HTTP_PORT}" > /dev/null && break
    echo "."
    UISPTOOLSRunning=false
    n=$((n+1))
  done

  docker ps

  if [ "${UISPTOOLSRunning}" = true ]; then
    echo "UISPTOOLS is running"
  else
    fail "UISPTOOLS is NOT running"
  fi
}


# prepare --silent option for curl
curlSilent=""
#if [ "${UNATTENDED}" = "true" ]; then
#  curlSilent="--silent"
#fi

if [ -z "$NOCREATEUSER" ]
then
  echo "skipping create user"
else
  create_user      
fi


create_app_folder
create_data_volumes
pull_install_files
change_owner
get_latest_image
start_docker_containers
remove_old_images
confirm_success
exit 0