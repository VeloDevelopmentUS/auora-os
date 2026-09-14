#!/bin/sh
# Builds Aura OS into a bootable ISO using debian-live-build.
# Run this ON A DEBIAN OR UBUNTU MACHINE WITH NETWORK ACCESS
# (a VM is fine — just not this same VM you're about to boot the result in).
set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "This needs root (live-build's chroot steps require it). Try: sudo ./build.sh"
  exit 1
fi

if ! command -v lb >/dev/null 2>&1; then
  echo "live-build isn't installed. Run:"
  echo "  sudo apt update && sudo apt install -y live-build debootstrap debian-archive-keyring"
  exit 1
fi

echo "== Cleaning any previous build state =="
lb clean --purge || true

echo "== Configuring the live-build project =="
lb config \
  --distribution bookworm \
  --architectures amd64 \
  --archive-areas "main contrib non-free non-free-firmware" \
  --mirror http://deb.debian.org/debian/ \
  --security-mirror http://security.debian.org/ \
  --linux-packages "linux-image" \
  --bootloader grub-efi \
  --bootappend-live "boot=live components quiet splash" \
  --debian-installer none

echo "== Building the ISO (this downloads packages — needs network, and 20-40+ min) =="
lb build

if [ -f live-image-amd64.hybrid.iso ]; then
  mv live-image-amd64.hybrid.iso aura-os.iso
  echo
  echo "Done: aura-os.iso"
  echo "Default login — username: aura   password: aura  (change it before sharing this image)"
else
  echo "Build finished but the expected ISO file wasn't found — check the log above for errors."
  exit 1
fi
