# Releasing NodeDrop Terminal

Releases are built by GitHub Actions and published as GitHub Releases. This is the whole process.

## 1. Prepare the version

1. Set the new version in `package.json` (`"version"`), update `CHANGELOG.md` / `CHANGELOG.en.md` and commit to `main`.
2. Make sure `package-lock.json` is in sync (`npm install`, then commit it). The build uses `npm ci`, which fails if the lock file is out of date.

## 2. Build

Run the [Build Windows workflow](https://github.com/nodedropweb/nodedrop/actions/workflows/build-windows.yml) from the Actions tab
(*Run workflow* on `main`), or push a tag that starts with `v`:

```bash
git tag v0.14.6
git push origin v0.14.6
```

The workflow builds the installer and the zip with `task package -- --win nsis zip` and uploads them as the
artifact `nodedrop-windows-unsigned`. A full build takes about 16 minutes.

The MSI target is not built in CI: its ICE validation needs administrator rights. To build it locally
as an administrator, run `npm exec electron-builder -- -c electron-builder.config.cjs -p never --win msi`.

## 3. Sign

Release binaries are signed with the certificate described in [CODE_SIGNING_POLICY.md](CODE_SIGNING_POLICY.md).
Until a signing service has been set up, releases are published unsigned and say so in their description.

## 4. Publish

1. Download the artifact (`gh run download <run-id> -n nodedrop-windows-unsigned`) and compute the checksums:
   `sha256sum NodeDrop-win32-x64-*.exe NodeDrop-win32-x64-*.zip > SHA256SUMS.txt`.
2. Create the release with the files and the checksums attached:

```bash
gh release create v0.14.6 NodeDrop-win32-x64-0.14.6.exe NodeDrop-win32-x64-0.14.6.zip SHA256SUMS.txt \
    --title "NodeDrop Terminal 0.14.6" --notes-file release-notes.md --latest
```

## Update channels

Automatic updates are disabled and no update feed is configured. Users install new versions from the release page.
