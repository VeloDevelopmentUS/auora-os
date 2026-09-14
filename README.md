# Aura OS

A real, custom-branded desktop OS you build into a bootable ISO and run
in VMware (or real hardware). Read this section before you build —
it's short and it'll save you time.

## What this actually is (read this first)

You asked for something that's fully custom from the kernel up *and*
runs Windows `.exe` files and Linux apps, on Intel/AMD/Nvidia hardware.
Those two goals are in direct tension: **Windows/Linux app compatibility
comes from being compatible with Windows/Linux, not from being custom.**
A from-scratch kernel can't run either without reimplementing Win32
(Wine's actual job, ~30 years of work) and/or the Linux syscall ABI.

So this project takes the approach every real system with that
capability takes: **a genuine Linux base you don't see or touch**
(Debian), with:
- A completely custom desktop shell (window manager theme, dock, login
  screen) — none of it looks or feels like a stock Linux desktop
- Wine bundled in for Windows `.exe`/`.msi` support
- Every native Linux package/Flatpak just works, because it *is* Linux
- Runs on any Intel/AMD CPU and Intel/AMD/Nvidia GPU — this is standard
  x86_64 hardware support, not something that needs custom work

**What "custom" honestly means here:** the boot splash, login screen,
window theme, dock, wallpaper, and browser start page are all custom
work in this project (real files, all included below). The kernel,
drivers, and Win32/POSIX compatibility layers are the parts that are
deliberately *not* reinvented, because reinventing them buys you nothing
but years of work and worse app compatibility than what's here.

If what you actually want is a from-scratch kernel with no Linux
anywhere in it, that's buildable too (see the earlier `minimal-os`
project in this conversation) — but it categorically cannot run `.exe`
or Linux binaries. You can't have both; this project picks the one that
gets you a usable OS.

## What you get

- **Boot**: custom "Aura" Plymouth splash (procedurally-generated logo
  included, `logo.png`) instead of a wall of boot text
- **Login**: glass-styled PIN/password screen (LightDM + a real HTML/CSS/JS
  greeter theme) — one local account, no online account of any kind
- **Desktop**: Openbox (WM) + tint2 (dock) + picom (compositor, for real
  window transparency/blur) — styled dark/glass to match the reference
  look, not stock Linux defaults
- **Browser**: "Aura Browser" — real Chromium under a custom launcher,
  icon, and start page
- **Windows apps**: Wine + Winetricks preinstalled
- **Linux apps**: apt + Flatpak both work normally
- **VM tools**: open-vm-tools (VMware), spice-vdagent/qemu-guest-agent
  (other hypervisors, for testing outside VMware)
- **No bloat**: no office suite, no games, no trialware. Every enabled
  background service is listed in `config/hooks/normal/0300-*` and
  everything explicitly disabled is in `0400-*` — nothing hidden.

## Build option A: in the cloud (no local Linux, no local disk space)

This repo includes `.github/workflows/build-iso.yml`, which builds the
ISO on a temporary machine GitHub provides for free — nothing installs
on your computer except the final `.iso` you download afterward.

1. Create a free GitHub account if you don't have one, and create a new
   **public** repository (public repos get free, unlimited Actions build
   time; private repos are capped on the free plan).
2. On the repo page, use "Add file → Upload files" and drag in the
   entire contents of this folder (including the hidden `.github`
   folder — if your OS hides it, use "uploading a folder" rather than
   picking files one by one, or use GitHub Desktop, which shows hidden
   folders).
3. Commit directly to `main`. This alone triggers the build.
4. Click the **Actions** tab → you'll see "Build Aura OS ISO" running.
   Click into it and watch the log live if you want.
5. When it finishes (green check, 20–60+ minutes), scroll to the bottom
   of that run page to **Artifacts** → download `aura-os-iso.zip` →
   unzip it → you have `aura-os.iso`.

If the build fails with a disk-space error, GitHub's free runners have
~14GB free — the workflow already strips some preinstalled toolchains
to make room, but if it's still tight, the `drivers.list.chroot`
package list is the safest one to trim (Nvidia/AMD driver packages are
the largest chunk of it).

## Build option B: on a Linux machine you control

If you do have access to a Debian/Ubuntu machine or VM with network
access:

```bash
sudo apt update
sudo apt install -y live-build
cd aura-os-build
sudo ./build.sh
```

This downloads the entire package set from Debian's repositories and
assembles the image — expect 20–40+ minutes depending on your
connection, and several GB of downloads. When it finishes you'll have
`aura-os.iso` in this folder.

Either way, this sandbox itself has no network access and no ISO-build
tools, so I can't run either build myself — you'll run one of these on
your end.

## Run it

**VMware:** New VM → point it at `aura-os.iso` → Linux / Debian 12
(64-bit) as the guest OS type → give it at least 4GB RAM and 2 CPUs →
boot.

Login: username `aura`, password `aura`. **Change this password before
sharing the image with anyone** — see `config/hooks/normal/0100-create-user.hook.chroot`.

## Nvidia GPU note

The ISO ships with the open-source Nouveau driver, which works
out-of-the-box but is slower than Nvidia's proprietary driver for
gaming/3D. After first boot (with network access), run:

```bash
aura-setup-nvidia
```

This isn't baked into the ISO itself because the proprietary driver
needs a kernel module (DKMS) built against your exact running kernel —
not knowable at ISO build time — plus redistribution licensing reasons.

## Windows app compatibility, honestly

Wine runs a lot of everyday Windows software and many older/simpler
games well. It will **not** run: anything with kernel-mode
anti-cheat (most competitive multiplayer games), most DRM-locked
software, or apps depending on obscure Windows-only drivers. Test the
specific apps you care about — [winehq.org/AppDB](https://appdb.winehq.org)
tracks compatibility per-app.

## Project layout

```
build.sh                              Runs live-build with the right flags
config/
  package-lists/*.list.chroot         What gets installed (desktop, browser, wine, drivers, vm tools)
  hooks/normal/*.hook.chroot          Build-time setup: multiarch, user creation, branding, services
  includes.chroot/
    etc/lightdm/                      Login manager config (webkit greeter, no autologin)
    usr/share/lightdm-webkit/themes/aura/   Login screen HTML/CSS/JS
    usr/share/plymouth/themes/aura/   Boot splash (script-based Plymouth theme)
    usr/share/backgrounds/            Wallpaper (generated)
    usr/share/pixmaps/aura/           Logo/icon at a few sizes (generated)
    etc/xdg/openbox/                  Window manager config + autostart
    etc/xdg/tint2/tint2rc             Dock config
    etc/xdg/picom.conf                Compositor (window transparency/blur)
    usr/local/bin/aura-browser        Chromium launcher with custom start page
    usr/local/bin/aura-setup-nvidia   Post-install proprietary Nvidia driver installer
    usr/local/share/aura-start/       Browser start page
    usr/share/applications/*.desktop  App launchers used by the dock
```

## Next real steps, if you keep going

- **Rebrand Chromium's actual window chrome** (not just the launcher):
  requires compiling Chromium from source with a custom `BRANDING` file
  — a multi-hour build on its own, separate from this project
  - **Custom settings app** to replace `lxappearance` with something that
  matches the aesthetic — a GTK or web-based (Electron) app is the
  realistic path
- **Installer** (so the ISO can install to a real disk, not just run
  live): add `calamares` or Debian's own `debian-installer` to the
  package lists and live-build's `--debian-installer` flag
- **UEFI Secure Boot** support: needs a signed shim bootloader, its own
  can of worms — `--bootloaders grub-efi` here gets you plain UEFI boot,
  not Secure-Boot-signed boot
