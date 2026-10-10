// Copyright 2026, nodedropweb
// SPDX-License-Identifier: Apache-2.0
//
// Renders the NodeDrop brand assets (PNG / ICO / ICNS) from the SVG masters in assets/.
// Uses Electron as the SVG rasteriser, so no extra tooling is needed:
//
//   npx electron scripts/brand/render-brand.cjs
//
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const out = (p) => path.join(root, p);
const readSvg = (p) => fs.readFileSync(out(p), "utf8");

app.disableHardwareAcceleration();
// keep the app alive between renders (default is to quit when the last window closes)
app.on("window-all-closed", () => {});

async function renderPng(svg, w, h) {
    const win = new BrowserWindow({
        width: Math.max(w, 300),
        height: Math.max(h, 300),
        useContentSize: true,
        show: false,
        frame: false,
        transparent: true,
        webPreferences: { offscreen: true },
    });
    const b64 = Buffer.from(svg).toString("base64");
    const html = `<html><body style="margin:0;background:transparent;overflow:hidden"><img src="data:image/svg+xml;base64,${b64}" style="width:${w}px;height:${h}px;display:block"></body></html>`;
    const tmpFile = path.join(require("os").tmpdir(), "nodedrop-brand-" + process.pid + "-" + w + "x" + h + ".html");
    fs.writeFileSync(tmpFile, html);
    await win.loadFile(tmpFile);
    await new Promise((r) => setTimeout(r, 500));
    let img = await win.webContents.capturePage({ x: 0, y: 0, width: w, height: h });
    const size = img.getSize();
    if (size.width !== w || size.height !== h) {
        img = img.resize({ width: w, height: h, quality: "best" });
    }
    const png = img.toPNG();
    win.destroy();
    fs.rmSync(tmpFile, { force: true });
    return png;
}

function write(rel, data) {
    fs.mkdirSync(path.dirname(out(rel)), { recursive: true });
    fs.writeFileSync(out(rel), data);
    console.log("wrote", rel, typeof data === "string" ? data.length : data.length + " bytes");
}

// --- ICO with embedded PNGs --------------------------------------------------
function makeIco(pngs /* [{size, data}] */) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(pngs.length, 4);
    const entries = [];
    let offset = 6 + 16 * pngs.length;
    for (const p of pngs) {
        const e = Buffer.alloc(16);
        e.writeUInt8(p.size >= 256 ? 0 : p.size, 0);
        e.writeUInt8(p.size >= 256 ? 0 : p.size, 1);
        e.writeUInt8(0, 2);
        e.writeUInt8(0, 3);
        e.writeUInt16LE(1, 4);
        e.writeUInt16LE(32, 6);
        e.writeUInt32LE(p.data.length, 8);
        e.writeUInt32LE(offset, 12);
        offset += p.data.length;
        entries.push(e);
    }
    return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// --- ICNS with embedded PNGs -------------------------------------------------
function makeIcns(chunks /* [{type, data}] */) {
    const parts = chunks.map((c) => {
        const h = Buffer.alloc(8);
        h.write(c.type, 0, 4, "ascii");
        h.writeUInt32BE(8 + c.data.length, 4);
        return Buffer.concat([h, c.data]);
    });
    const body = Buffer.concat(parts);
    const head = Buffer.alloc(8);
    head.write("icns", 0, 4, "ascii");
    head.writeUInt32BE(8 + body.length, 4);
    return Buffer.concat([head, body]);
}

// --- composed logos ----------------------------------------------------------
const GRAD = `<linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00F0FF"/><stop offset="0.6" stop-color="#7B5CFF"/><stop offset="1" stop-color="#FF2BD6"/></linearGradient>`;
function horizontal(iconB64, w, h, { theme, subtitle }) {
    const pad = Math.round(h * 0.04);
    const iconSize = Math.round(h * 0.86);
    const iconY = Math.round((h - iconSize) / 2);
    const textX = iconSize + pad * 3;
    const nameSize = Math.round(h * (subtitle ? 0.4 : 0.52));
    const nameY = subtitle ? Math.round(h * 0.55) : Math.round(h * 0.64);
    const subColor = theme === "dark" ? "#A9AED6" : "#4A4E78";
    const nameFill = theme === "dark" ? "url(#t)" : "url(#t)";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${GRAD}</defs>
  <image x="${pad}" y="${iconY}" width="${iconSize}" height="${iconSize}" href="data:image/svg+xml;base64,${iconB64}"/>
  <text x="${textX}" y="${nameY}" font-family="'Segoe UI Semibold','Segoe UI','Helvetica Neue',Arial,sans-serif" font-weight="700" font-size="${nameSize}" letter-spacing="${Math.round(nameSize * -0.02)}" fill="${nameFill}">nodedrop</text>
  ${
      subtitle
          ? `<text x="${textX + 6}" y="${Math.round(h * 0.82)}" font-family="'Cascadia Mono',Consolas,'Courier New',monospace" font-size="${Math.round(h * 0.15)}" letter-spacing="${Math.round(h * 0.075)}" fill="${subColor}">terminal</text>`
          : ""
  }
</svg>`;
}

// flat single-colour variants for places that want a simple mark
function iconVariants() {
    const drop = "M512 262 C512 262 272 520 272 656 C272 790 380 880 512 880 C644 880 752 790 752 656 C752 520 512 262 512 262 Z";
    const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><title>NodeDrop</title>`;
    const prompt = `<path d="M410 590 L516 680 L410 770 M556 776 L636 776" stroke-width="54" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
    return {
        solid: `${head}<defs><mask id="m"><rect width="1024" height="1024" fill="#fff"/>${prompt} stroke="#000"/></mask></defs><g fill="#00F0FF"><circle cx="512" cy="146" r="46"/><path d="${drop}" mask="url(#m)"/></g></svg>`,
        outline: `${head}<g fill="none" stroke="#00F0FF" stroke-linecap="round" stroke-linejoin="round"><circle cx="512" cy="146" r="46" fill="#00F0FF" stroke="none"/><path d="${drop}" stroke-width="44"/>${prompt} stroke="#00F0FF"/></g></svg>`,
        "outline-duotone": `${head}<g stroke-linecap="round" stroke-linejoin="round"><circle cx="512" cy="146" r="46" fill="#FF2BD6"/><path d="${drop}" fill="#00F0FF" fill-opacity="0.18" stroke="#00F0FF" stroke-width="44"/>${prompt} stroke="#FF2BD6"/></g></svg>`,
    };
}

app.whenReady().then(async () => {
    try {
        const icon = readSvg("assets/nodedrop-logo_icon.svg");
        const withBg = readSvg("assets/nodedrop-logo-with-bg.svg");
        const iconB64 = Buffer.from(icon).toString("base64");

        // app icons (with background)
        const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
        const bg = {};
        for (const s of sizes) bg[s] = await renderPng(withBg, s, s);
        write("build/icon.ico", makeIco([16, 24, 32, 48, 64, 128, 256].map((s) => ({ size: s, data: bg[s] }))));
        write(
            "build/icon.icns",
            makeIcns([
                { type: "ic11", data: bg[32] },
                { type: "ic12", data: bg[64] },
                { type: "ic07", data: bg[128] },
                { type: "ic13", data: bg[256] },
                { type: "ic08", data: bg[256] },
                { type: "ic14", data: bg[512] },
                { type: "ic09", data: bg[512] },
                { type: "ic10", data: bg[1024] },
            ])
        );
        for (const s of [16, 32, 48, 64, 128, 256, 512]) write(`build/icons/${s}x${s}.png`, bg[s]);

        write("assets/nodedrop-logo-with-bg.png", await renderPng(withBg, 192, 192));
        write("assets/nodedrop-logo-with-bg.ico", makeIco([16, 32, 48, 64, 128, 256].map((s) => ({ size: s, data: bg[s] }))));
        write("assets/appicon-windows.png", bg[256]);
        write("assets/appicon-windows.svg", withBg);

        // public/logos
        write("public/logos/nodedrop-logo-dark.png", bg[1024]);
        write("public/logos/nodedrop-logo.png", await renderPng(icon, 1563, 1563));
        write("public/logos/nodedrop-logo-256.png", await renderPng(icon, 256, 256));

        // horizontal logos
        const hDark = horizontal(iconB64, 2250, 750, { theme: "dark", subtitle: true });
        const hLight = horizontal(iconB64, 2250, 750, { theme: "light", subtitle: true });
        write("assets/nodedrop-logo-horizontal-dark.png", await renderPng(hDark, 2250, 750));
        write("assets/nodedrop-logo-horizontal-light.png", await renderPng(hLight, 2250, 750));
        const wDark = horizontal(iconB64, 1130, 270, { theme: "dark", subtitle: false });
        const wLight = horizontal(iconB64, 1130, 270, { theme: "light", subtitle: false });
        write("assets/nodedrop-dark.png", await renderPng(wDark, 1130, 270));
        write("assets/nodedrop-light.png", await renderPng(wLight, 1130, 270));
        write("public/logos/nodedrop-dark.png", await renderPng(wDark, 1130, 270));

        // flat svg variants
        const v = iconVariants();
        for (const [name, svg] of Object.entries(v)) write(`assets/nodedrop-logo_icon-${name}.svg`, svg + "\n");
    } catch (e) {
        console.error("render failed", e);
        process.exitCode = 1;
    } finally {
        app.quit();
    }
});
